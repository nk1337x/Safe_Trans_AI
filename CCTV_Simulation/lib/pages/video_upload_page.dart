import 'dart:convert';
import 'dart:io';
import 'dart:async';

import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:lottie/lottie.dart';
import 'package:video_player/video_player.dart';
import 'package:shared_preferences/shared_preferences.dart';

class VideoUploadPage extends StatefulWidget {
  final String location;
  final String coordinates;

  VideoUploadPage(this.location, this.coordinates);

  @override
  _VideoUploadPageState createState() => _VideoUploadPageState();
}

class _VideoUploadPageState extends State<VideoUploadPage> {
  File? videoFile;
  VideoPlayerController? _videoController;
  String serverUrl = 'http://192.168.1.100:5000';
  double videoDuration = 0.0;
  bool isLoading = false;
  String? jobId;
  String? processingStatus;
  Timer? _statusCheckTimer;
  String? errorMessage;
  bool isProcessingComplete = false;
  VideoPlayerController? _processedVideoController;

  @override
  void initState() {
    super.initState();
    _loadServerUrl();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _processedVideoController?.dispose();
    _statusCheckTimer?.cancel();
    super.dispose();
  }

  // Load server URL from saved settings
  Future<void> _loadServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString('serverUrl') ?? 'http://192.168.1.100:5000';
    setState(() {
      serverUrl = savedUrl;
    });
  }

  // Save server URL to settings
  Future<void> _saveServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('serverUrl', url);
  }

  // Helper method to show snackbar notifications
  void _showSnackBar(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError 
            ? Color(0xFFEF4444).withOpacity(0.9)
            : Color(0xFF3B82F6).withOpacity(0.9),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: Duration(seconds: 3),
      ),
    );
  }

  // Pick a video from the gallery
  Future<void> _pickVideo() async {
    // Reset state
    setState(() {
      isProcessingComplete = false;
      jobId = null;
      processingStatus = null;
      errorMessage = null;
      _processedVideoController?.dispose();
      _processedVideoController = null;
    });

    final pickedFile = await ImagePicker().pickVideo(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        videoFile = File(pickedFile.path);
        _videoController?.dispose();
        _videoController = VideoPlayerController.file(videoFile!)
          ..initialize().then((_) {
            setState(() {
              videoDuration = _videoController!.value.duration.inSeconds.toDouble();
            });
            _videoController!.play();
          });
      });
      _showSnackBar('Video selected successfully');
    }
  }

  // Upload the video to the server
  Future<void> _uploadVideo() async {
    if (videoFile == null) {
      _showSnackBar('Please select a video first', isError: true);
      return;
    }

    setState(() {
      isLoading = true;
      processingStatus = 'uploading';
      errorMessage = null;
      isProcessingComplete = false;
    });

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$serverUrl/api/upload'),
      );
      request.files.add(await http.MultipartFile.fromPath('video', videoFile!.path));
      request.fields['location'] = widget.location;
      request.fields['coordinates'] = widget.coordinates;

      var response = await request.send();
      var responseData = await http.Response.fromStream(response);

      if (response.statusCode == 200) {
        var result = json.decode(responseData.body);
        setState(() {
          jobId = result['job_id'];
          processingStatus = result['status']; // Should be 'queued'
        });
        _showSnackBar(result['message'] ?? 'Video uploaded successfully');
        
        // Start polling for status
        _startStatusPolling();
      } else {
        throw Exception('Failed to upload video: ${responseData.body}');
      }
    } catch (e) {
      print('Error: $e');
      _showSnackBar('Error uploading video: $e', isError: true);
      setState(() {
        isLoading = false;
        processingStatus = null;
      });
    }
  }

  // Start polling for job status
  void _startStatusPolling() {
    _statusCheckTimer?.cancel();
    _statusCheckTimer = Timer.periodic(Duration(seconds: 2), (timer) {
      _checkJobStatus();
    });
  }

  // Check job status
  Future<void> _checkJobStatus() async {
    if (jobId == null) return;

    try {
      var response = await http.get(Uri.parse('$serverUrl/api/status/$jobId'));

      if (response.statusCode == 200) {
        var result = json.decode(response.body);
        String status = result['status'];

        setState(() {
          processingStatus = status;
        });

        if (status == 'completed') {
          _statusCheckTimer?.cancel();
          setState(() {
            isLoading = false;
            isProcessingComplete = true;
          });
          _showSnackBar('Video processing completed!');
        } else if (status == 'failed') {
          _statusCheckTimer?.cancel();
          setState(() {
            isLoading = false;
            errorMessage = result['error'] ?? 'Processing failed';
          });
          _showSnackBar('Processing failed: ${result['error'] ?? 'Unknown error'}', isError: true);
        } else if (status == 'processing') {
          // Continue polling
          if (processingStatus != 'processing') {
            _showSnackBar('Video is being processed...');
          }
        }
      }
    } catch (e) {
      print('Error checking status: $e');
    }
  }

  // Download processed video
  Future<void> _downloadProcessedVideo() async {
    if (jobId == null) return;

    try {
      _showSnackBar('Download URL: $serverUrl/api/download/$jobId');
      // TODO: Implement actual download functionality
      // You can open this URL in a browser or implement file download
    } catch (e) {
      print('Error: $e');
      _showSnackBar('Error: $e', isError: true);
    }
  }

  // Show server settings dialog
  void _showSettingsDialog() {
    String tempUrl = serverUrl;
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Color(0xFF1E293B),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
            side: BorderSide(color: Color(0xFF3B82F6), width: 1),
          ),
          title: Text(
            'Server Settings',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 20,
              color: Colors.white,
            ),
          ),
          content: TextField(
            onChanged: (value) => tempUrl = value,
            controller: TextEditingController(text: serverUrl),
            style: TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Server URL',
              labelStyle: TextStyle(color: Color(0xFF3B82F6)),
              hintText: 'http://192.168.1.100:5000',
              hintStyle: TextStyle(color: Colors.white38),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Color(0xFF3B82F6).withOpacity(0.5)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: Color(0xFF3B82F6)),
              ),
              filled: true,
              fillColor: Color(0xFF0F172A),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: TextStyle(color: Colors.white70)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF3B82F6),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onPressed: () {
                setState(() => serverUrl = tempUrl);
                _saveServerUrl(tempUrl);
                Navigator.pop(context);
                _showSnackBar('Server URL updated');
              },
              child: Text('Save', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  String _getStatusText() {
    switch (processingStatus) {
      case 'uploading':
        return 'Uploading video...';
      case 'queued':
        return 'Video queued for processing...';
      case 'processing':
        return 'Processing video with AI...';
      case 'completed':
        return 'Processing completed!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Ready to upload';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // AppBar
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () {
                        _statusCheckTimer?.cancel();
                        Get.back();
                      },
                      icon: Icon(Icons.arrow_back, color: Colors.white),
                    ),
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.groups, color: Color(0xFF3B82F6), size: 24),
                          SizedBox(width: 12),
                          Text(
                            'Crowd Detection',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.settings, color: Colors.white),
                      onPressed: _showSettingsDialog,
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Location Card
                        Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                          elevation: 8,
                          margin: EdgeInsets.symmetric(horizontal: 10),
                          color: Color(0xFF1E293B),
                          child: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(15),
                              border: Border.all(color: Color(0xFF60A5FA), width: 1),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Icon(Icons.location_on, color: Color(0xFF3B82F6), size: 20),
                                      SizedBox(width: 8),
                                      Text(
                                        'SafeRide Video Analysis',
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: Color(0xFF3B82F6),
                                        ),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 10),
                                  Text(
                                    'Location: ${widget.location}',
                                    style: TextStyle(fontSize: 14, color: Colors.white70),
                                  ),
                                  SizedBox(height: 5),
                                  Text(
                                    'Coordinates: ${widget.coordinates}',
                                    style: TextStyle(fontSize: 14, color: Colors.white70),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        SizedBox(height: 20),

                        // Video Preview
                        if (videoFile != null && _videoController != null && _videoController!.value.isInitialized)
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(15),
                              boxShadow: [
                                BoxShadow(
                                  color: Color(0xFF3B82F6).withOpacity(0.3),
                                  spreadRadius: 3,
                                  blurRadius: 7,
                                  offset: Offset(0, 3),
                                ),
                              ],
                              border: Border.all(
                                color: Color(0xFF3B82F6).withOpacity(0.5),
                                width: 1,
                              ),
                              color: Colors.black45,
                            ),
                            margin: EdgeInsets.symmetric(horizontal: 10),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(15),
                              child: AspectRatio(
                                aspectRatio: _videoController!.value.aspectRatio,
                                child: Chewie(
                                  controller: ChewieController(
                                    videoPlayerController: _videoController!,
                                    autoPlay: false,
                                    looping: false,
                                  ),
                                ),
                              ),
                            ),
                          ),

                        // Processed Video Preview
                        if (_processedVideoController != null && _processedVideoController!.value.isInitialized)
                          Column(
                            children: [
                              SizedBox(height: 20),
                              Text(
                                'Processed Video',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF3B82F6),
                                ),
                              ),
                              SizedBox(height: 10),
                              Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(15),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Color(0xFF10B981).withOpacity(0.3),
                                      spreadRadius: 3,
                                      blurRadius: 7,
                                      offset: Offset(0, 3),
                                    ),
                                  ],
                                  border: Border.all(
                                    color: Color(0xFF10B981).withOpacity(0.5),
                                    width: 1,
                                  ),
                                  color: Colors.black45,
                                ),
                                margin: EdgeInsets.symmetric(horizontal: 10),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(15),
                                  child: AspectRatio(
                                    aspectRatio: _processedVideoController!.value.aspectRatio,
                                    child: Chewie(
                                      controller: ChewieController(
                                        videoPlayerController: _processedVideoController!,
                                        autoPlay: true,
                                        looping: true,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),

                        // Lottie Animation when no video
                        if (videoFile == null && _processedVideoController == null)
                          Lottie.asset(
                            'assets/lottie/CCTV.json',
                            height: 200,
                          ),

                        SizedBox(height: 25),

                        // Status Indicator
                        if (isLoading || processingStatus != null)
                          Container(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Column(
                              children: [
                                if (processingStatus == 'uploading' || processingStatus == 'queued' || processingStatus == 'processing')
                                  SpinKitDualRing(color: Color(0xFF3B82F6)),
                                SizedBox(height: 8),
                                Text(
                                  _getStatusText(),
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                if (jobId != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 8.0),
                                    child: Text(
                                      'Job ID: $jobId',
                                      style: TextStyle(
                                        color: Colors.white54,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),

                        // Error Message
                        if (errorMessage != null)
                          Container(
                            padding: EdgeInsets.all(12),
                            margin: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              color: Color(0xFFEF4444).withOpacity(0.2),
                              border: Border.all(
                                color: Color(0xFFEF4444).withOpacity(0.5),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.error_outline, color: Color(0xFFEF4444)),
                                SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    errorMessage!,
                                    style: TextStyle(
                                      color: Color(0xFFEF4444),
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Action Buttons
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            ElevatedButton.icon(
                              onPressed: isLoading ? null : _pickVideo,
                              icon: Icon(Icons.video_library, color: Colors.white),
                              label: Text(
                                'Pick Video',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Color(0xFF3B82F6),
                                disabledBackgroundColor: Color(0xFF3B82F6).withOpacity(0.5),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                padding: EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                                elevation: 8,
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: (isLoading || videoFile == null) ? null : _uploadVideo,
                              icon: Icon(Icons.cloud_upload, color: Colors.white),
                              label: Text(
                                'Upload',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Color(0xFF60A5FA),
                                disabledBackgroundColor: Color(0xFF60A5FA).withOpacity(0.5),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                padding: EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                                elevation: 8,
                              ),
                            ),
                          ],
                        ),

                        SizedBox(height: 20),

                        // Download Button (shown when processing is complete)
                        if (isProcessingComplete && jobId != null)
                          ElevatedButton.icon(
                            onPressed: _downloadProcessedVideo,
                            icon: Icon(Icons.download, color: Colors.white),
                            label: Text(
                              'Download Processed Video',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF10B981),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(30),
                              ),
                              padding: EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                              elevation: 8,
                            ),
                          ),

                        SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

void main() => runApp(MaterialApp(home: VideoUploadPage('Location', 'Coordinates')));

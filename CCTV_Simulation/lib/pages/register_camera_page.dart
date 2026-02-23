import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:crowd_monitor/pages/video_upload_page.dart';
import 'package:crowd_monitor/pages/settings_page.dart';
import 'package:get/get.dart';

class RegisterCameraPage extends StatefulWidget {
  @override
  _RegisterCameraPageState createState() => _RegisterCameraPageState();
}

class _RegisterCameraPageState extends State<RegisterCameraPage> {
  String? _selectedLocality;
  final Map<String, List<double>> localityCoordinates = {
    'Downtown Central': [40.7589, -73.9851],
    'North Station': [40.7831, -73.9712],
    'East Market': [40.7489, -73.9680],
    'West Plaza': [40.7614, -73.9776],
    'South Terminal': [40.7489, -73.9925],
    'Central Park': [40.7829, -73.9654],
    'Harbor District': [40.7061, -74.0087],
    'University Area': [40.8075, -73.9626],
    'Industrial Zone': [40.7282, -73.9942],
    'Residential North': [40.7956, -73.9720],
    'Shopping District': [40.7484, -73.9857],
    'Airport Road': [40.7769, -73.9121],
  };

  String? _coordinates;

  void _goToNextPage() {
    if (_selectedLocality != null) {
      final coordinates = localityCoordinates[_selectedLocality];
      _coordinates = '${coordinates![0]}, ${coordinates[1]}';

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => VideoUploadPage(
            _selectedLocality!,
            _coordinates!,
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select a location first!')),
      );
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
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                AppBar(
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  centerTitle: true,
                  title: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.camera, color: Color(0xFF3B82F6), size: 24),
                      SizedBox(width: 8),
                      Text(
                        'SafeRide',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    IconButton(
                      icon: Icon(Icons.settings, color: Color(0xFF3B82F6)),
                      onPressed: () {
                        Get.to(() => SettingsPage());
                      },
                      tooltip: 'Settings',
                    ),
                  ],
                ),
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(height: 20),
                        Lottie.asset(
                          'assets/lottie/GlobalGPS.json',
                          height: 200,
                          repeat: true,
                          animate: true,
                        ),
                        SizedBox(height: 20),
                        Card(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                          elevation: 8,
                          margin: EdgeInsets.symmetric(horizontal: 10),
                          color: Color(0xFF1E293B),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(15),
                              border: Border.all(
                                  color: Color(0xFF3B82F6), width: 1),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Camera Registration',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    color: Color(0xFF3B82F6),
                                    ),
                                  ),
                                  SizedBox(height: 10),
                                  Text(
                                    'Please select the transport location:',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.white70,
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  Container(
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                          color: Color(0xFF3B82F6)
                                              .withOpacity(0.5)),
                                      color: Color(0xFF0F172A),
                                    ),
                                    child: DropdownButtonFormField<String>(
                                      value: _selectedLocality,
                                      hint: Text(
                                        'Select a Location',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      icon: Icon(Icons.arrow_drop_down,
                                          color: Color(0xFF3B82F6)),
                                      dropdownColor: Color(0xFF1E293B),
                                      decoration: InputDecoration(
                                        contentPadding: EdgeInsets.symmetric(
                                            horizontal: 16, vertical: 8),
                                        border: InputBorder.none,
                                      ),
                                      onChanged: (String? newValue) {
                                        setState(() {
                                          _selectedLocality = newValue;
                                        });
                                      },
                                      items: localityCoordinates.keys
                                          .map<DropdownMenuItem<String>>(
                                              (String value) {
                                        return DropdownMenuItem<String>(
                                          value: value,
                                          child: Text(value,
                                              style: TextStyle(
                                                  color: Colors.white)),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                  SizedBox(height: 20),
                                  if (_selectedLocality != null)
                                    Container(
                                      padding: EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(10),
                                        color:
                                            Color(0xFF3B82F6).withOpacity(0.1),
                                        border: Border.all(
                                            color: Color(0xFF3B82F6)
                                                .withOpacity(0.3)),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Selected Location: $_selectedLocality',
                                            style: TextStyle(
                                              fontSize: 16,
                                              color: Colors.white,
                                            ),
                                          ),
                                          SizedBox(height: 5),
                                          Text(
                                            'Coordinates: ${localityCoordinates[_selectedLocality]?.join(", ")}',
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.white70,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        SizedBox(height: 30),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Color(0xFF3B82F6),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            padding: EdgeInsets.symmetric(
                                vertical: 12, horizontal: 40),
                            elevation: 8,
                          ),
                          onPressed: _goToNextPage,
                          child: Text(
                            'Next',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

void main() => runApp(MaterialApp(home: RegisterCameraPage()));

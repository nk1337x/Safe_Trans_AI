import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:crowd_monitor/pages/register_camera_page.dart';

void main() {
  runApp(CrowdMonitorApp());
}

class CrowdMonitorApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Crowd Monitor',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: RegisterCameraPage(),
    );
  }
}

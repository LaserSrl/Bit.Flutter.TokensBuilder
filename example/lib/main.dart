import 'package:example/resources/figma.g.dart';
import 'package:example/utils/theme_extensions.dart';
import 'package:flutter/material.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // theme: ThemeData(extensions: extensions),
      builder: (context, child) {
        final extensions = switch (context.width) {
          > 1024 => Figma.desktop,
          > 600 => Figma.tablet,
          _ => Figma.mobile,
        };
        return Theme(
          data: Theme.of(context).copyWith(extensions: extensions),
          child: child!,
        );
      },
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    

    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(context.spacings.space16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text('You have pushed the button this many times:'),
            Text('_counter', style: context.textTheme.headlineMedium),
          ],
        ),
      ),
    );
  }
}

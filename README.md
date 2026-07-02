# Common-Base Amplifier Simulator

A web-based interactive simulator for analyzing the DC operating point and low-frequency AC response of a common-base BJT amplifier.

## Live Demo

[Open the simulator](https://muhalicure.github.io/common-base-amplifier-simulator/)

## Project Overview

This project was developed to make common-base amplifier analysis more interactive and easier to understand.

Instead of using fixed circuit values, the user can modify circuit parameters and observe how the transistor operating region, DC values, voltage gain, and frequency response change in real time.

## Features

- Adjustable circuit parameters
  - VCC and VEE supply voltages
  - RC, RE, RL, and source resistance
  - Transistor current gain beta
  - VBE voltage
  - Input and output coupling capacitors, C1 and C2

- DC operating point analysis
  - Base current, IB
  - Collector current, IC
  - Emitter current, IE
  - VBE, VCB, and VCE voltages

- Automatic transistor operating-region detection
  - Active region
  - Saturation region
  - Cutoff region

- Low-frequency AC analysis
  - Dynamic emitter resistance, re
  - Approximate voltage gain, Av
  - Input corner frequency, fc1
  - Output corner frequency, fc2
  - Lower cutoff frequency, fL

- Frequency-response graph

- Ready-to-use test scenarios
  - Active region
  - Saturation region
  - Cutoff region
  - Low lower-cutoff-frequency scenario

- Experiment record table for comparing different circuit conditions

- Automatic result interpretation panel

## Technologies Used

- HTML5
- CSS3
- JavaScript
- SVG for circuit diagrams and frequency-response visualization

## How It Works

The simulator first calculates the DC operating point of the transistor.

If the transistor is in the active region, the application performs a simplified small-signal AC analysis. It calculates the emitter dynamic resistance, voltage gain, corner frequencies, and lower cutoff frequency.

If the transistor is in saturation or cutoff, the AC analysis is disabled because the small-signal model is not considered valid in those operating regions.

## Important Note

This project uses a simplified educational model of a common-base BJT amplifier. Real transistor behavior can also be affected by temperature, component tolerances, parasitic capacitances, and other non-ideal effects.

## Author

Muhammed Ali Cüre  

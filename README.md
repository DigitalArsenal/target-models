# Geospatial Data Parser

## Overview

This Node.js application is designed to parse Excel files containing geospatial data and convert each sheet within the Excel file into a separate JSON file. The application utilizes Node.js's `cluster` module to process each sheet in parallel, improving performance and efficiency.

## Prerequisites

- Node.js (version 16 or later recommended)
- npm (usually comes with Node.js)

## Installation

Clone the repository to your local machine:

```bash
git clone ssh://git@gitlab.sdataplab.com:10022/tjkoury/target-models.git
```

Navigate to the project directory and install dependencies:

```bash
cd target-models
npm install
```

## Usage

1. Place your Excel file containing the geospatial data in the `./raw/` directory.
2. Run the script with the following command:

```bash
node index.js
```

The script will read each sheet from the Excel file and convert it into a JSON file, which will be saved in the `./data/` directory.

## Features

- **Parallel Processing**: Each sheet in the Excel file is processed in a separate worker process.
- **Non-blocking**: Utilizes Node.js's asynchronous capabilities to ensure efficient processing.
- **No Overwrite**: Skips processing sheets for which the output JSON file already exists.

## Customization

You can modify the `index.js` file to change the input file path, output directory, or to add additional data processing logic as per your requirements.

## Contributing

Contributions to this project are welcome. Please fork the repository and submit a pull request with your proposed changes.

## License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

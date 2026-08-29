# PNG-DeFaker

PNG-DeFaker is a small, browser-based tool for restoring transparency in images. It runs locally in your browser, so image files are not uploaded to a server by the application.

## What it can do

- Remove a selected background color.
- Remove connected background areas with Smart Flood.
- Try checkerboard background removal.
- Use a luminance mask.
- Use OpenCV contour processing.
- Adjust tolerance and edge feathering.
- Preview before and after results with a slider.
- Inspect the result in a larger zoomable preview.
- Paint corrections onto the mask.
- Export the result as a PNG.
- Remember settings and the last selected image in the browser.

The processing methods are useful for different types of images, but complex artwork may still need manual correction.

## Requirements

- Node.js 18 or newer.
- A modern web browser such as Chrome, Firefox, Edge, or Safari.
- OpenCV.js is loaded from the OpenCV website when the page is opened. An internet connection is needed for the OpenCV contour method unless OpenCV.js is hosted locally.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Synergyst/PNG-DeFaker.git
   ```

2. Enter the project directory:

   ```bash
   cd PNG-DeFaker
   ```

3. No package installation is required. The project uses Node.js built-in modules only.

## Start the application

Run:

```bash
node server.js
```

The server listens on port `38783` and prints its address in the terminal:

```text
[SERVER] Listening on http://0.0.0.0:38783
```

Open the application at:

```text
http://localhost:38783/
```

To stop the server, press `Ctrl+C` in the terminal.

## Using PNG-DeFaker

1. Drop an image into the upload area, or click it to choose a file.
2. Choose a recovery method.
3. Select the target background color.
4. Adjust the tolerance if needed.
5. The image is processed automatically. You can also click **EXECUTE DE-FAKE**.
6. Move the comparison slider to inspect the original and restored versions.
7. Use **SHOW MASK** and the brush controls to correct areas manually.
8. Click **EXPORT 32-BIT PNG** to save the result.

The checkerboard pattern shown behind transparent pixels is only a preview. It is not included in the exported PNG.

## Configuration and saved data

PNG-DeFaker stores preferences and the last selected image in browser storage on your device. It does not send those files to the application server.

Use **RESET PREFERENCES** in the footer to remove saved preferences and the saved last image from the current browser.

## Running behind HTTPS

The included server provides HTTP only. If you use a public HTTPS address, such as `https://defaker.synergyst.club/`, place the Node.js server behind an HTTPS reverse proxy such as Nginx, Caddy, or Apache.

The reverse proxy should forward requests to:

```text
http://127.0.0.1:38783
```

## Project files

- `server.js` — native Node.js static file server.
- `public/index.html` — application structure and controls.
- `public/style.css` — visual design and responsive layout.
- `public/script.js` — image processing and browser interactions.
- `LICENSE` — MIT license.

## License

PNG-DeFaker is licensed under the MIT License. See [LICENSE](LICENSE).

import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

# serves the electron renderer as a plain browser app
PORT = 47105
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

if __name__ == "__main__":
    handler = partial(SimpleHTTPRequestHandler, directory=DIRECTORY)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), handler)
    print(f"Panel served on http://0.0.0.0:{PORT}")
    server.serve_forever()

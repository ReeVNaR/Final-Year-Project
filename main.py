import cv2
import mediapipe as mp
import numpy as np
import math
import os

# Configure MediaPipe and suppress warnings
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.8,
    min_tracking_confidence=0.8
)

FINGERS = {
    "thumb": (4, 3),
    "index": (8, 7),
    "middle": (12, 11),
    "ring": (16, 15),
    "pinky": (20, 19)
}

def is_finger_visible(tip_lm, mid_lm):
    return tip_lm.y < mid_lm.y

def is_palm_visible(hand_landmarks):
    # Get wrist and all knuckle (MCP) points
    wrist = hand_landmarks.landmark[0]
    index_mcp = hand_landmarks.landmark[5]
    middle_mcp = hand_landmarks.landmark[9]
    ring_mcp = hand_landmarks.landmark[13]
    pinky_mcp = hand_landmarks.landmark[17]
    
    # Count how many knuckles are below the wrist
    knuckles_below = sum(1 for knuckle in [index_mcp, middle_mcp, ring_mcp, pinky_mcp] 
                        if knuckle.y > wrist.y)
    
    # If any knuckles are below wrist, palm is likely visible
    return knuckles_below >= 2

def rotate_image(img, angle):
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w/2, h/2), angle, 1)
    return cv2.warpAffine(img, M, (w, h), borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0,0))

def overlay_transparent(bg, overlay, x, y):
    if overlay is None:
        return bg
        
    bh, bw = bg.shape[:2]
    oh, ow = overlay.shape[:2]
    
    # Check bounds
    if x + ow > bw or y + oh > bh or x < 0 or y < 0:
        return bg

    bg_crop = bg[y:y+oh, x:x+ow]
    alpha = overlay[:, :, 3] / 255.0

    for c in range(3):
        bg_crop[:, :, c] = alpha * overlay[:, :, c] + (1 - alpha) * bg_crop[:, :, c]

    bg[y:y+oh, x:x+ow] = bg_crop
    return bg

class NailOverlay:
    def __init__(self, nail_image_path=None):
        # Load nail image
        if nail_image_path and os.path.exists(nail_image_path):
            self.nail_img = cv2.imread(nail_image_path, cv2.IMREAD_UNCHANGED)
            if self.nail_img is None:
                raise ValueError("Could not load nail image")
            
            # Add alpha channel if not present
            if self.nail_img.shape[2] == 3:
                b, g, r = cv2.split(self.nail_img)
                alpha = np.ones(b.shape, dtype=b.dtype) * 255
                self.nail_img = cv2.merge([b, g, r, alpha])
        else:
            self.nail_img = self.create_default_nail()

    def create_default_nail(self, size=50):
        img = np.zeros((size, size, 4), dtype=np.uint8)
        img[:, :] = [200, 192, 255, 255]  # Pink color
        
        # Create circular gradient for alpha
        center = size // 2
        for i in range(size):
            for j in range(size):
                dist = np.sqrt((i - center)**2 + (j - center)**2)
                if dist > size/2:
                    img[i, j, 3] = 0
                elif dist > size/3:
                    alpha = int(255 * (1 - (dist - size/3)/(size/6)))
                    img[i, j, 3] = max(0, min(alpha, 255))
        return img

    def detect_and_overlay_nails(self, frame, scale_factor=1.0, rotate_angle=0):
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(img_rgb)
        h, w, _ = frame.shape

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                # Skip overlaying nails if palm is visible
                if is_palm_visible(hand_landmarks):
                    continue
                    
                for _, (tip_idx, mid_idx) in FINGERS.items():
                    tip_lm = hand_landmarks.landmark[tip_idx]
                    mid_lm = hand_landmarks.landmark[mid_idx]

                    if is_finger_visible(tip_lm, mid_lm):
                        tip = (int(tip_lm.x * w), int(tip_lm.y * h))
                        mid = (int(mid_lm.x * w), int(mid_lm.y * h))

                        # Calculate angle and size
                        dx, dy = tip[0] - mid[0], tip[1] - mid[1]
                        angle = -math.degrees(math.atan2(dy, dx)) + rotate_angle
                        distance = int(math.hypot(dx, dy) * scale_factor)

                        # Resize and rotate nail
                        nail_size = max(25, min(70, distance))
                        resized = cv2.resize(self.nail_img, (nail_size, nail_size))
                        rotated = rotate_image(resized, angle)

                        # Calculate position
                        x_offset = tip[0] - rotated.shape[1] // 2
                        y_offset = tip[1] - rotated.shape[0] // 2
                        
                        # Apply overlay
                        frame = overlay_transparent(frame, rotated, x_offset, y_offset)

        return frame

from flask import Flask, render_template, Response, request, jsonify
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
app.config['nail_settings'] = {'scale': 1.0, 'rotate': -90}
nail_overlay = NailOverlay("nail.png")

def generate_frames():
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            return b''
            
        while True:
            success, frame = cap.read()
            if not success:
                break
            else:
                # Process frame with nail overlay
                frame = nail_overlay.detect_and_overlay_nails(frame)
                
                # Convert to jpg for streaming
                ret, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
    except Exception as e:
        print(f"Camera error: {e}")
    finally:
        if 'cap' in locals():
            cap.release()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/update_settings', methods=['POST'])
def update_settings():
    data = request.json
    if data:
        app.config['nail_settings'] = {
            'scale': float(data.get('scale', 1.0)),
            'rotate': float(data.get('rotate', 0))
        }
    return jsonify({'status': 'success'})

@app.route('/upload_nail', methods=['POST'])
def upload_nail():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        img = Image.open(BytesIO(file.read()))
        img.save('nail.png')
        nail_overlay.__init__('nail.png')
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def main():
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

if __name__ == "__main__":
    main()

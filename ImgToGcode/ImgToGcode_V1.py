
import cv2
import numpy as np

img = cv2.imread("image.png")
if img is None:
    raise SystemExit("image.png not found or failed to load")
img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

lower = np.array([0, 0, 0])
upper = np.array([25, 25, 25])

mask = cv2.inRange(img_hsv, lower, upper)
binary = (mask > 0).astype(np.uint8)

pixel_size = 0.2  # mm par pixel
feed_rate = 3000

# Zone de travail en pixels (ROI). Ajustez ces valeurs pour limiter le G-code à une partie de l'image.
x_min, x_max = 0, binary.shape[1] - 1
y_min, y_max = 0, binary.shape[0] - 1

gcode = []
gcode.append("G21 ; unités en mm")
gcode.append("G90 ; positionnement absolu")
gcode.append("M5  ; laser off")

# Appliquer la ROI au masque binaire
roi_mask = np.zeros_like(binary, dtype=np.uint8)
roi_mask[y_min:y_max + 1, x_min:x_max + 1] = 1
binary_roi = binary * roi_mask

# Reconnaissance vectorielle simple par contours
contours, _ = cv2.findContours(binary_roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

if contours:
    for contour in contours:
        perimeter = cv2.arcLength(contour, True)
        epsilon = max(0.5, 0.002 * perimeter)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        points = approx[:, 0, :]

        if len(points) < 2:
            continue

        if np.array_equal(points[0], points[-1]):
            points = points[:-1]

        if len(points) < 2:
            continue

        start_x, start_y = points[0]
        gcode.append(f"G0 X{start_x * pixel_size:.3f} Y{start_y * pixel_size:.3f}")
        gcode.append("M3 ; laser on")

        for x, y in points:
            gcode.append(f"G1 X{x * pixel_size:.3f} Y{y * pixel_size:.3f} F{feed_rate}")

        gcode.append("M5 ; laser off")
else:
    # Fallback si aucun contour n'est détecté
    for y in range(binary.shape[0]):
        if not (y_min <= y <= y_max):
            continue

        x0 = 0 * pixel_size
        y_pos = y * pixel_size
        gcode.append(f"G0 X{x0:.3f} Y{y_pos:.3f}")

        row_has_active_pixel = False

        for x in range(binary.shape[1]):
            if not (x_min <= x <= x_max):
                continue

            if binary[y, x] != 1:
                continue

            row_has_active_pixel = True
            x_pos = x * pixel_size
            gcode.append("M3 ; laser on")
            gcode.append(f"G1 X{x_pos:.3f} Y{y_pos:.3f} F{feed_rate}")

        if row_has_active_pixel:
            gcode.append("M5 ; laser off")

gcode.append("M5 ; laser off")
gcode.append("G0 X0 Y0")

with open("sortie.gcode", "w", encoding="utf-8") as f:
    f.write("\n".join(gcode))

print("G-code généré : sortie.gcode")
uniform sampler2D u_texture;
uniform bool u_renderpass;
uniform vec2 u_resolution;
uniform float u_frame;
varying vec2 vUv;

void main() {
  vec2 uv_pixel_step = 1. / u_resolution.xy;
  int neighbours = 0;
  vec4 originalColor = texture(u_texture, vUv);

  if (u_renderpass) {
    // Finding Neighbours
    for (int i = -1; i < 2; i++) {
      for (int j = -1; j < 2; j++) {
        if (i != 0 || j != 0) {
          float neighAlive = texture(u_texture, vUv + (uv_pixel_step * vec2(i, j))).x;

          // Check if pixel is white
          if (neighAlive > 0.5) { 
            neighbours += 1; 
          } 
        }
      }
    }

    // Getting Colors
    vec4 newColor;
    float alive = originalColor.x;

    // float shadeFactor = max(-0.49, u_frame * -0.001);

    if (alive >= 0.5) {
      // Become Dead (red)
      if (neighbours <= 1 || neighbours >= 4) {
        newColor = vec4(0., 0., 0., 1.);

      // Stay Alive (white)
      } else {
        newColor = vec4(1., 1., 1., 1.);
      }
    } else {
      // Become Alive (green)
      if (neighbours == 3) {
        newColor = vec4(1., 1., 1., 1.);
      
      // Stay Dead (black)
      } else {
        newColor = vec4(0., 0., 0., 1.);
      }
    }

    gl_FragColor = newColor;

    // We store post processing effects inside the g/y value of the fragColor
    // x is where the live or dead state is
    if(u_frame > 2.) {
      // Create blur if pixel has changed in this frame (maybe died)
      gl_FragColor.y = originalColor.y * .988 + gl_FragColor.x; // this introduces a motion fade

      // the threshold of when to slow down fading the blur
      if(gl_FragColor.y < .2) {
        // Fade away the blur even slower
        gl_FragColor.y  *= .99; 
      }
    }

    // Centre circle fade
    vec2 centre = u_resolution / 2.;
    float centreFactor =  (1. / ((centre.y * centre.y))) *
      (
        ((gl_FragCoord.x - centre.x - 0.5) * (gl_FragCoord.x - centre.x - 0.5)) +
        ((gl_FragCoord.y - centre.y - 0.5) * (gl_FragCoord.y - centre.y - 0.5)) -
        ((u_resolution.x / 4.2) * (u_resolution.y / 4.2))
      );

    centreFactor = min(centreFactor, 1.); // Can't be bigger than 1
    centreFactor = max(centreFactor, 0.); // Can't be smaller than 0

    gl_FragColor.y *= centreFactor;

  } else {
    gl_FragColor = vec4(originalColor.y);
  }
}
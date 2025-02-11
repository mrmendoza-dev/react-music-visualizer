varying float vDistance;
uniform vec3 startColor;
uniform vec3 endColor;
uniform float time;

float circle(in vec2 _st, in float _radius) {
    vec2 dist = _st - vec2(0.5);
    return 1.0 - smoothstep(_radius - (_radius * 0.05),  // Increased smoothstep range
                           _radius + (_radius * 0.05),
                           dot(dist, dist) * 3.0);        // Reduced multiplication for bigger circles
}

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Add fractal noise for more complex patterns
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    // Enhanced dynamic UV coordinates
    vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    
    // Multiple layers of wobble
    float fastWobble = sin(time * 4.0 + vDistance * 15.0) * 0.15;
    float slowWobble = sin(time * 1.5 + vDistance * 8.0) * 0.2;
    uv += fastWobble * vec2(cos(time * 2.0 + uv.x), sin(time * 2.0 + uv.y));
    uv += slowWobble * vec2(sin(time + uv.y), cos(time + uv.x));
    
    // Spiral distortion
    float angle = atan(uv.y - 0.5, uv.x - 0.5);
    float spiral = sin(angle * 3.0 + time * 2.0) * 0.1;
    uv += spiral * vec2(cos(angle), sin(angle));
    
    // Dynamic radius with multiple frequencies
    float radius = 1.0 + sin(time * 3.0 + vDistance * 5.0) * 0.2 
                      + cos(time * 4.0 + vDistance * 7.0) * 0.15
                      + sin(time * 5.0) * 0.1;
    vec3 circ = vec3(circle(uv, radius));
    
    // Enhanced color mixing with noise layers
    float colorMix = vDistance + sin(time * 2.0) * 0.3 + cos(time * 3.0) * 0.2;
    float noisePattern = noise(uv * 5.0 + time * 0.5) * 0.3;
    colorMix = clamp(colorMix + noisePattern, 0.0, 1.0);
    
    // Complex color manipulation
    vec3 color = mix(startColor, endColor, colorMix);
    color *= 1.0 + noise(uv * 8.0 + time * 0.2) * 0.4; // Add noise to brightness
    
    // Enhanced pulsing effect
    float fastPulse = sin(time * 6.0 + vDistance * 10.0) * 0.3;
    float slowPulse = sin(time * 2.0 + vDistance * 5.0) * 0.4;
    float pulse = 0.8 + fastPulse + slowPulse;
    
    // More intense glow
    float glow = 1.0 - length(uv - 0.5) * 1.5; // Reduced falloff for stronger glow
    glow = pow(glow, 2.0) * 1.5; // Increased intensity
    vec3 glowColor = mix(endColor * 1.5, startColor * 1.5, 1.0 - vDistance);
    color += glow * glowColor;
    
    // Add electric effect
    float electric = pow(random(uv + time * 0.1), 5.0) * 2.0;
    color += electric * mix(startColor, endColor, sin(time * 3.0));
    
    // Dynamic alpha with multiple components
    float alpha = circ.r * vDistance * pulse;
    alpha *= 1.0 + glow * 0.5; // Glow affects alpha
    alpha *= 1.0 + electric * 0.3; // Electric effect affects alpha
    
    // Add chromatic aberration effect
    vec2 offset = (uv - 0.5) * 0.1;
    color.r += noise(uv + offset + time * 0.2) * 0.2;
    color.b += noise(uv - offset + time * 0.2) * 0.2;
    
    // Final color with enhanced saturation
    color = pow(color, vec3(0.8)); // Increase color intensity
    gl_FragColor = vec4(color, alpha);
}
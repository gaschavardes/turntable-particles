#include <defaultFrag>

varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vPUv;

void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength *= 2.0;
    strength = 1.0 - strength;

    gl_FragColor = vec4(0., 1., 1., 1.);
    }
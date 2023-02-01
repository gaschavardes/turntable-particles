#version 300 es
#include <defaultFrag>

in vec3 vNormal;
in vec3 vColor;

out vec4 outColor;

void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength *= 2.0;
    strength = 1.0 - strength;

    outColor = vec4(1., 1., 1., strength);
    }
#version 300 es
#include <defaultFrag>

in vec3 vNormal;
in vec3 vColor;
in vec2 vPUv;
in vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uJointTexture;

out vec4 outColor;

void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength *= 2.0;
    strength = 1.0 - strength;

	vec4 t = texture(uTexture, vUv);

    outColor = vec4(vNormal, 1.);
    }
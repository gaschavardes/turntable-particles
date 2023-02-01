#version 300 es
#include <defaultFrag>

in vec3 vNormal;
in vec3 vColor;
in vec2 vPUv;
in vec2 vUv;
in float vRadius;
uniform sampler2D uTexture;
uniform sampler2D uJointTexture;
uniform float uRotationProgress;
out vec4 outColor;

void main() {
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength *= 2.0;
    strength = 1.0 - strength;

	vec4 t = texture(uTexture, vUv);
	float alpha = smoothstep(0., .2, vRadius) -  smoothstep(4.9, 5., vRadius);
	alpha = mix(1., alpha, uRotationProgress);
    outColor = vec4(vNormal, alpha);
    }
#include <defaultVert>

varying vec3 vNormal;
varying vec2 vUv;
attribute vec3 pointPos;
attribute mat4 instanceMatrix;
attribute vec3 instanceColor;
attribute float randomVal;
uniform vec2 uTextureSize;
uniform float uTime;
uniform sampler2D displaceText;
varying vec2 vPUv;

mat4 rotationMatrix(vec3 axis, float angle)
{
		axis = normalize(axis);
		float s = sin(angle);
		float c = cos(angle);
		float oc = 1.0 - c;

		return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
														oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
														oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
														0.0,                                0.0,                                0.0,                                1.0);
}
mat4 translationMatrix(vec3 axis)
{

		return mat4(1., 0., 0., 0.,
					0., 1., 0., 0.,
					0., 0., 1., 0., 
					axis.r * randomVal, axis.g * randomVal, axis.b * randomVal, 1.);
}

void main()	{
    #include <normalsVert>
	vec3 matrixPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
	vUv = uv;
	vec2 puv = matrixPos.xy / (15.);
	vPUv = puv;

	// float t = texture2D(displaceText, puv + vec2(0.5, 0.5)).r;
	vec3 t = texture2D(displaceText, puv + vec2(0.5, 0.5)).rgb;

	// mat4 translated = instanceMatrix * translationMatrix(t) * rotationMatrix(t, (t.r + t.g + t.b) * 10.);
	mat4 translated = instanceMatrix * translationMatrix(t) * rotationMatrix(vec3(1., 1., 1.) + t, (t.r + t.g + t.b) * 10.);
   gl_Position = projectionMatrix * modelViewMatrix * translated * vec4( position, 1.0 );
}
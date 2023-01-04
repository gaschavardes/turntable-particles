#include <defaultVert>

attribute vec3 offset;
varying vec3 vNormal;
varying vec2 vUv;
uniform vec2 uTextureSize;
uniform float uTime;
uniform sampler2D displaceText;
void main()	{
    #include <normalsVert>

    vUv = uv;
	vec2 puv = offset.xy / uTextureSize;
	vPUv = puv;
	
    vec3 transformedPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( transformedPosition, 1.0 );
}
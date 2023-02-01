#version 300 es
#include <defaultVert>

in vec3 vNormal;

uniform float uSize;
uniform float uTime;

out vec3 vColor;

float rand(float n){return fract(sin(n) * 43758.5453123);}

float noise(float p){
	float fl = floor(p);
  float fc = fract(p);
	return mix(rand(fl), rand(fl + 1.0), fc);
}
	
void main()	{

    vColor = color;
	float wind = uTime * 0.5;
	vec3 newPos = position;
	newPos.y += wind;
	newPos.y = mod(newPos.y, 13.) - 8.;
	vec3 noiseVal = vec3(noise((uTime) * 0.1 * newPos.x ), 0., uTime * 20. * 0.);

	newPos += vec3(sin(noiseVal.x), noiseVal.y, noiseVal.z);
	newPos.z = mod(newPos.z, 10.) - 10. ;

    gl_PointSize = uSize * clamp(position.z * 0.5, 0.8, 2.) ;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0 );
}
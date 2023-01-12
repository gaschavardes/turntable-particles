#version 300 es
#include <defaultVert>

out vec3 vNormal;
out vec2 vUv;

in mat4 instanceMatrix;
in vec4 skinIndex;
in vec4 skinWeight;
in float randomVal;
in float animationProgress;
in vec4 spherePosition;

uniform vec2 uTextureSize;
uniform float uTime;
uniform sampler2D displaceText;
uniform highp sampler2D uJointTexture;

uniform mat4 bindMatrix;
uniform mat4 bindMatrixInverse;
// uniform highp sampler2D boneTexture;
uniform int boneTextureSize;

out vec2 vPUv;

// mat4 getBoneMatrix(uint jointNdx) {
//   return mat4(
//     texelFetch(uJointTexture, ivec2(0, jointNdx), 0),
//     texelFetch(uJointTexture, ivec2(1, jointNdx), 0),
//     texelFetch(uJointTexture, ivec2(2, jointNdx), 0),
//     texelFetch(uJointTexture, ivec2(3, jointNdx), 0));
// }

mat4 getBoneMatrix( const in float i ) {
	float j = i * 4.0;
	float x = mod( j, float( boneTextureSize ) );
	float y = floor( j / float( boneTextureSize ) );
	float dx = 1.0 / float( boneTextureSize );
	float dy = 1.0 / float( boneTextureSize );
	y = dy * ( y + 0.5 );
	vec4 v1 = texture( uJointTexture, vec2( dx * ( x + 0.5 ), y ) );
	vec4 v2 = texture( uJointTexture, vec2( dx * ( x + 1.5 ), y ) );
	vec4 v3 = texture( uJointTexture, vec2( dx * ( x + 2.5 ), y ) );
	vec4 v4 = texture( uJointTexture, vec2( dx * ( x + 3.5 ), y ) );
	mat4 bone = mat4( v1, v2, v3, v4 );
	return bone;
}

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
	vec3 transformed = mix(vec3(position), vec3(spherePosition), animationProgress);
	vec3 matrixPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
	vUv = uv;
	vec2 puv = matrixPos.xy / (15.);
	vPUv = puv;

	// float t = texture2D(displaceText, puv + vec2(0.5, 0.5)).r;
	vec3 t = texture(displaceText, puv + vec2(0.5, 0.5)).rgb;

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );

	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;

	transformed = ( bindMatrixInverse * skinned ).xyz;

 	float vx = (t.r *2. - 1.);
	float vy = -(t.g *2. - 1.);
	float intensity = t.b;
	// mat4 translated = instanceMatrix * translationMatrix(t) * rotationMatrix(t, (t.r + t.g + t.b) * 10.);
	mat4 translated = instanceMatrix * translationMatrix(vec3(vx * intensity, vy * intensity, 0.) * 10.) * rotationMatrix(vec3(1., 1., 1.) + t, (t.r + t.g + t.b) * 10.);

   gl_Position = projectionMatrix * modelViewMatrix * translated  * vec4( transformed, 1.0 );
}
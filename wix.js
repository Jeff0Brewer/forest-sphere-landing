const sphere = new Float32Array([//sphere data])
const IMG_URL = 'https://static.wixstatic.com/media/aceb60_aafb536da0984d9a96efa2cf45060ad5~mv2.jpg'
const VERTEX_SHADER = `
        //Classic Perlin Noise by Stefan Gustavson
        float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }
        vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
        vec3 fade(vec3 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }
        float cnoise(vec3 P){
            vec3 Pi0 = floor(P);
            vec3 Pi1 = Pi0 + vec3(1.0);
            Pi0 = mod289(Pi0);
            Pi1 = mod289(Pi1);
            vec3 Pf0 = fract(P);
            vec3 Pf1 = Pf0 - vec3(1.0);
            vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
            vec4 iy = vec4(Pi0.yy, Pi1.yy);
            vec4 iz0 = Pi0.zzzz;
            vec4 iz1 = Pi1.zzzz;
            vec4 ixy = permute(permute(ix) + iy);
            vec4 ixy0 = permute(ixy + iz0);
            vec4 ixy1 = permute(ixy + iz1);
            vec4 gx0 = ixy0 * (1.0 / 7.0);
            vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
            gx0 = fract(gx0);
            vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
            vec4 sz0 = step(gz0, vec4(0.0));
            gx0 -= sz0 * (step(0.0, gx0) - 0.5);
            gy0 -= sz0 * (step(0.0, gy0) - 0.5);
            vec4 gx1 = ixy1 * (1.0 / 7.0);
            vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
            gx1 = fract(gx1);
            vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
            vec4 sz1 = step(gz1, vec4(0.0));
            gx1 -= sz1 * (step(0.0, gx1) - 0.5);
            gy1 -= sz1 * (step(0.0, gy1) - 0.5);
            vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
            vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
            vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
            vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
            vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
            vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
            vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
            vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
            vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
            g000 *= norm0.x;
            g010 *= norm0.y;
            g100 *= norm0.z;
            g110 *= norm0.w;
            vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
            g001 *= norm1.x;
            g011 *= norm1.y;
            g101 *= norm1.z;
            g111 *= norm1.w;
            float n000 = dot(g000, Pf0);
            float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
            float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
            float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
            float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
            float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
            float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
            float n111 = dot(g111, Pf1);
            vec3 fade_xyz = fade(Pf0);
            vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
            vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
            float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
            return 2.2 * n_xyz;
        }

        attribute vec3 position;
        uniform mat4 projMatrix;
        uniform mat4 viewMatrix;
        uniform float offset;
        uniform float screenAspect;
        uniform float imageAspect;
        varying vec3 warped;
        varying vec3 normal;
        varying vec2 texcoord;

        // noise function for sphere distort
        vec3 warp(vec3 pos, float offset) {
            float warpScale = .08;
            float angle = 3.5*atan(pos.x, pos.z);
            float spin = 3.0*pos.y+angle/3.14159;
            vec3 noisePos = 0.4*pos+spin-offset;
            return pos*(1.0-warpScale)+pos*cnoise(noisePos)*warpScale;
        }

        // calculate normal by sampling warp function at multiple points
        vec3 getWarpNorm(vec3 position, vec3 warped, float offset) {
            vec3 ny = vec3(0.0, -1.0, 0.0);
            vec3 tangA = cross(position, ny);
            vec3 tangB = cross(position, tangA);
            float tangOffset = 0.1;
            vec3 posA = normalize(position+tangA*tangOffset);
            vec3 posB = normalize(position+tangB*tangOffset);
            vec3 warpA = warp(posA, offset);
            vec3 warpB = warp(posB, offset);
            return cross(warpA-warped, warpB-warped);
        }

        // calc texture coordinate bounds to align sphere texture with bg image
        vec2 getTexCoordBound(float texAspect, float screenAspect) {
            return vec2(min(screenAspect/imageAspect, 1.0), min(imageAspect/screenAspect, 1.0));
        }

        void main() {
            warped = warp(position, offset);
            normal = getWarpNorm(position, warped, offset);
            gl_Position = projMatrix * viewMatrix * vec4(warped, 1.0);

            vec3 clip = gl_Position.xyz / gl_Position.w;
            texcoord = (clip.xy + 1.0)*.5;
            texcoord.y = 1.0 - texcoord.y;
            texcoord = texcoord*getTexCoordBound(imageAspect, screenAspect);
        }
`
const FRAGMENT_SHADER = `
        precision highp float;

        varying vec3 normal;
        varying vec3 warped;
        varying vec2 texcoord;
        uniform sampler2D texture;

        void main() {
            vec3 fragNorm = normalize(normal);
            vec3 lightPos = vec3(0.0, 8.0, 11.0);
            vec3 lightNorm = normalize(lightPos - warped);
            vec3 lightReflect = 2.0*fragNorm*dot(fragNorm, lightNorm) - lightNorm;

            float specular = pow(clamp(dot(warped, lightReflect), 0.0, 1.0), 8.0);
            float shade = clamp(dot(fragNorm, lightNorm), 0.0, 1.0);
            float ambient = 0.2;

            vec3 color = texture2D(texture, texcoord - 1.5*normal.xy).xyz;
            vec3 shaded = clamp(shade*color + ambient*color + .6*specular, 0.0, 1.0);
            gl_FragColor = vec4(shaded, 1.0);
        }
`

const run = parent => {
    // create and add elements for wix compatibility
    const wrap = document.createElement('div')
    const canvas = document.createElement('canvas')
    wrap.style.position = 'absolute'
    wrap.style.top = '0'
    wrap.style.left = '0'
    wrap.style.height = '100%'
    wrap.style.width = '100%'
    wrap.style.backgroundSize = 'cover'
    wrap.style.backgroudPositon = 'center'
    wrap.style.backgroundImage = `url('${IMG_URL}')`
    canvas.style.position = 'absolute'
    canvas.style.height = '100%'
    canvas.style.width = '100%'
    wrap.appendChild(canvas)
    parent.appendChild(wrap)

    const gl = canvas.getContext('webgl')
    gl.enable(gl.DEPTH_TEST)
    loadProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER)

    // initialize projection matrix and resize handler
    const projLoc = gl.getUniformLocation(gl.program, 'projMatrix')
    const screenLoc = gl.getUniformLocation(gl.program, 'screenAspect')
    setupViewport(gl, canvas, projLoc, screenLoc)
    window.addEventListener('resize', () => setupViewport(gl, canvas, projLoc, screenLoc))

    // initialize static gl resources
    // don't save references since values only need to be set once
    initBuffer(gl, sphere, gl.STATIC_DRAW)
    initAttribute(gl, 'position', 3, 3, 0, false, Float32Array.BYTES_PER_ELEMENT)
    createTexture(gl, IMG_URL)
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, 'viewMatrix'), false, VIEW_MATRIX)

    // start draw loop
    const offsetSpeed = .00025
    const offsetLoc = gl.getUniformLocation(gl.program, 'offset')
    const draw = time => {
        gl.uniform1f(offsetLoc, time*offsetSpeed)
        gl.drawArrays(gl.TRIANGLES, 0, NUM_VERTEX)
        window.requestAnimationFrame(draw)
    }
    window.requestAnimationFrame(draw)
}

const NUM_VERTEX = sphere.length/3

// static view matrix
const VIEW_MATRIX = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, -3, 1
])

// set static args for proj matrix, calc from aspect on screen change
const FOV = .35
const NEAR = 0.1
const FAR = 10.0
const getProjMatrix = (aspect) => {
    const rd = 1/(FAR - NEAR)
    const ct = Math.cos(FOV)/Math.sin(FOV)
    return new Float32Array([
        ct/aspect, 0, 0, 0,
        0, ct, 0, 0,
        0, 0, -(FAR+NEAR)*rd, -1,
        0, 0, -2*NEAR*FAR*rd, 0
    ])
}

const setupViewport = (gl, canvas, projLocation, screenLocation) => {
    const {devicePixelRatio: dpr} = window
    const {clientWidth: w, clientHeight: h} = canvas
    const aspect = w/h
    canvas.width = w*dpr
    canvas.height = h*dpr
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniformMatrix4fv(projLocation, false, getProjMatrix(aspect))
    gl.uniform1f(screenLocation, aspect)
}

const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    // log errors on shader compilation failure
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader))
    }
    return shader
}

const loadProgram = (gl, vertexSource, fragmentSource) => {
    const vertShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    const program = gl.createProgram()
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    gl.useProgram(program)
    gl.program = program
}

const initAttribute = (gl, name, size, stride, offset, normalized, typeSize) => {
    const location = gl.getAttribLocation(gl.program, name)
    gl.vertexAttribPointer(location, size, gl.FLOAT, normalized, stride * typeSize, offset * typeSize)
    gl.enableVertexAttribArray(location)
}

const initBuffer = (gl, data, drawType) => {
    const glBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, drawType)
}

const createTexture = (gl, url) => {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // set texture to solid color while image loads
    const tempColor = new Uint8Array([255, 255, 255, 255])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, tempColor)

    const img = new Image()
    img.crossOrigin = ''
    img.src = url
    img.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

        //set image aspect ratio uniform when image loaded
        gl.uniform1f(gl.getUniformLocation(gl.program, 'imageAspect'), img.width/img.height)
    })
}

class SphereLanding extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        run(this)
    }
}
customElements.define('sphere-landing', SphereLanding)

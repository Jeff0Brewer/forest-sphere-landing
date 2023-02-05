const run = () => {
    const canvas = document.getElementById('gl')
    const gl = canvas.getContext('webgl')
    gl.enable(gl.DEPTH_TEST)
    loadProgram(gl, 
        document.getElementById('vert').text, 
        document.getElementById('frag').text
    )

    // initialize projection matrix and resize handler
    const projLoc = gl.getUniformLocation(gl.program, 'projMatrix')
    const screenLoc = gl.getUniformLocation(gl.program, 'screenAspect')
    setupViewport(gl, canvas, projLoc, screenLoc)
    window.addEventListener('resize', () => setupViewport(gl, canvas, projLoc, screenLoc))

    // initialize static gl resources
    // don't save references since values only need to be set once
    initBuffer(gl, sphere, gl.STATIC_DRAW)
    initAttribute(gl, 'position', 3, 3, 0, false, Float32Array.BYTES_PER_ELEMENT)
    createTexture(gl, 'landing.jpg')
    gl.uniformMatrix4fv(gl.getUniformLocation(gl.program, 'viewMatrix'), false, VIEW_MATRIX)

    // start draw loop
    const offsetSpeed = .00025
    const offsetLoc = gl.getUniformLocation(gl.program, 'offset')
    const tick = time => {
        gl.uniform1f(offsetLoc, time*offsetSpeed);
        gl.drawArrays(gl.TRIANGLES, 0, NUM_VERTEX)
        window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
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
    const {innerWidth: w, innerHeight: h, devicePixelRatio: dpr} = window
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
    img.src = url
    img.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        //set image aspect ratio uniform when image loaded
        gl.uniform1f(gl.getUniformLocation(gl.program, 'imageAspect'), img.width/img.height)
    })
}

run()

const { mat4 } = glMatrix

const VIEW_MATRIX = mat4.lookAt(mat4.create(),
    [0, 0, 2.5], //eye
    [0, 0, 0], //focus
    [0, 1, 0] //up
)

const FOV = 40*Math.PI/180
const getProjMatrix = (aspect) => {
    return mat4.perspective(mat4.create(),
        FOV,
        aspect,
        0.1, //near
        10.0 //far
    )
}

const NUM_VERTEX = sphere.length/3

const run = () => {
    const canvas = document.getElementById('gl')
    const gl = canvas.getContext('webgl')
    gl.enable(gl.DEPTH_TEST)

    const vert = document.getElementById('vert').text
    const frag = document.getElementById('frag').text
    loadProgram(gl, vert, frag)

    setupViewport(gl, canvas)
    window.addEventListener('resize', () => setupViewport(gl, canvas))

    gl.uniformMatrix4fv(
        gl.getUniformLocation(gl.program, 'viewMatrix'),
        false,
        VIEW_MATRIX
    )
    initBuffer(gl, sphere, gl.STATIC_DRAW)
    initAttribute(gl, 'position', 3, 3, 0, false, Float32Array.BYTES_PER_ELEMENT)
    createTexture(gl, 'corp.jpg')

    const offsetScale = .0003
    const offsetLocation = gl.getUniformLocation(gl.program, 'offset')
    const tick = time => {
        gl.uniform1f(offsetLocation, time*offsetScale);
        gl.drawArrays(gl.TRIANGLES, 0, NUM_VERTEX)
        window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
}

const setupViewport = (gl, canvas) => {
    const {innerWidth: w, innerHeight: h, devicePixelRatio: dpr} = window
    canvas.width = w*dpr
    canvas.height = h*dpr
    gl.viewport(0, 0, canvas.width, canvas.height)
    if (gl.program) {
        gl.uniformMatrix4fv(
            gl.getUniformLocation(gl.program, 'projMatrix'), 
            false,
            getProjMatrix(w/h)
        )
        gl.uniform1f(gl.getUniformLocation(gl.program, 'screenAspect'), w/h)
    }
}

const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
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
    return program
}

const initAttribute = (gl, name, size, stride, offset, normalized, typeSize) => {
    const location = gl.getAttribLocation(gl.program, name)
    gl.vertexAttribPointer(location, size, gl.FLOAT, normalized, stride * typeSize, offset * typeSize)
    gl.enableVertexAttribArray(location)
    return location
}

const initBuffer = (gl, data, drawType) => {
    const glBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, glBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, drawType)
    return glBuffer
}

const createTexture = (gl, url) => {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // set texture to solid color while image loads
    const tempColor = new Uint8Array([255, 0, 255, 255])
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, tempColor)

    const img = new Image()
    img.src = url
    img.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.uniform1f(gl.getUniformLocation(gl.program, 'imageAspect'), img.width/img.height)
    })
}

run()

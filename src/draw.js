const { mat4 } = glMatrix

const VIEW_MATRIX = mat4.lookAt(mat4.create(),
    [-1, 0, 4], //eye
    [-1, 0, 0], //focus
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
    }
}

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

    createTexture(gl, document.getElementById('tex'))

    const offsetScale = .0005
    const offsetLocation = gl.getUniformLocation(gl.program, 'offset')
    const tick = time => {
        gl.uniform1f(offsetLocation, time*offsetScale);
        gl.drawArrays(gl.TRIANGLES, 0, NUM_VERTEX)
        window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
}

run()

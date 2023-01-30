const { mat4 } = glMatrix

const viewMatrix = mat4.lookAt(mat4.create(),
    [-1, 0, 5], //eye
    [-1, 0, 0], //focus
    [0, 1, 0] //up
)

const FOV = 80*Math.PI/180
const getProjMatrix = (aspect) => {
    return mat4.perspective(mat4.create(),
        FOV,
        aspect,
        0.1, //near
        10.0 //far
    )
}

const setupViewport = (gl, canvas) => {
    const {innerWidth: w, innerHeight: h, devicePixelRatio: dpr} = window
    canvas.width = w*dpr
    canvas.height = h*dpr
    gl.viewport(0, 0, canvas.width, canvas.height)
}

const run = () => {
    const canvas = document.getElementById('gl')
    const gl = canvas.getContext('webgl')
}

run()

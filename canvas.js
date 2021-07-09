const metaPixelWidth = ((layer) => {
  return Math.pow(11,layer);
})
const initialState = {
  dom : {
    canvas : {
      canvas : null,
      ctx : null,
      position : {
        grid   : null,
        cursor : null
      }
    },
    palette : {
      canvas : null,
      ctx : null,
      position : {
        grid   : null,
        cursor : null
      },
      complexity : null,
    },
    meta2Render : {
      canvas : null,
      ctx : null,
    },
    colorPicker : {
      canvas : null,
      ctx : null,
      rSlider : null,
      gSlider : null,
      bSlider : null,
      aSlider : null,
    },
    zipper : {
      canvas : null,
      ctx : null,
    }
  },
  view : {
    canvas : {
      grid : {
        positionDisplay : "canvas",
        mode : "on",
        color : "#888888",
      },
      cursor : {
        positionDisplay : "cursor",
        mode : "on",
        color : "#FF0000",
      },
      renderTime : 0
    },
    palette : {
      grid : {
        positionDisplay : "palette",
        mode : "on",
        color : "#888888",
      },
      cursor : {
        positionDisplay : "cursor",
        mode : "on",
        color : "#FF0000",
      },
      renderTime : 0
    },
    zipper : {
      grid : {
        positionDisplay : "palette",
        mode : "on",
        color : "#888888",
      },
      cursor : {
        positionDisplay : "cursor",
        mode : "on",
        color : "#FF0000",
      },
      renderTime : 0
    },

  },
  control : {
    focus : "canvas",
    foci : ["canvas", "palette","zipper"],
    movement : {
      canvas : {
        mode : "cursor",
        modes : ["cursor","grid"]

      },
      palette : {
        mode : "cursor",
        modes : ["cursor","grid"]
      },
      zipper : {
        mode : "cursor",
        modes : ["cursor","grid"]
      },
      mode : "cursor",
      modes : ["cursor","grid"]
    },
  },
  data : {
    tree : {
      //writing above zero layer pushes everything down
      zeroOffset : 0, //num 

      zipper : [], //TODO refactor pointer to be last element of zipper (it's a non-empty list)
      pointer : { structure : 0, x : 0, y : 0 },
      zipperCursor : 0,
      zipperOffset : 0,

      //append only CAS //can be garbage collected
      //self referential structure 
      structure : [],
      //{
      //  render : { 0 : null
      //           , 1 : null 
      //           , 2 : null
      //           },
      //  children : [ [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             , [0,0,0,0,0,0,0,0,0,0,0]
      //             ],
      //}
      //render CAS
      renderCache : {
          0 : [] // [hexColor] 
        , 1 : [] // [{ render : string, loaded : Image}]
        , 2 : [] // [{ render : string, loaded : Image}]
        , img : {}
      },
      palette : {}, // { x : structureRef }      
      palettePath : {},
      paletteCursor : 0,
      paletteOffset : 0,
    }
  }
};
var state = initialState;

//main()
window.onload = () => {
  setup(state)(() => {    
    renderEverything(state);
    document.addEventListener("keydown", event => {
      handleKeyDown(state,event);
    });
  });
}

const casArrayCache = (array) => {
  return (thing) => {
    const i = array.indexOf(thing)
    switch (i) {
      case -1:
        return array.push(thing) - 1;
      default:
        return i;
    }
  }
}


const meta2RenderData = (state) => {
  return state.dom.meta2Render.canvas.toDataURL('image/png');
}


const canvasToPng = (state) => {
  return state.dom.canvas.canvas.toDataURL('image/png');
}

const log_event = ((e) => {
  const d = new Date();
  event_log = document.getElementById("event_log");
  const p = document.createElement("p");
  p.innerHTML = "[" + d.toISOString() + "] " + e;
  event_log.prepend(p);
})

const setupCanvas = (state) => {
  state.dom.canvas.position.grid = document.getElementById("canvas.position.canvas");
  state.dom.canvas.position.cursor = document.getElementById("canvas.position.cursor")
  state.dom.canvas.renderTime = document.getElementById("canvas.renderTime");
  state.dom.canvas.canvas = document.getElementById("canvas");
  const canvas = state.dom.canvas.canvas;
  canvas.width = metaPixelWidth(3);
  canvas.height = metaPixelWidth(3); 
  state.dom.canvas.ctx = canvas.getContext('2d');
  const ctx = state.dom.canvas.ctx; 
}

const setupMeta2Render = (state) => {
  state.dom.meta2Render.canvas = document.getElementById("meta2render");
  state.dom.meta2Render.ctx = state.dom.meta2Render.canvas.getContext('2d');
  const canvas = state.dom.meta2Render.canvas;
  canvas.width = metaPixelWidth(2);
  canvas.height = metaPixelWidth(2);
}

const setupColorPickerRender = (state) => {
  state.dom.colorPicker.canvas = document.getElementById("colorPicker");
  state.dom.colorPicker.ctx = state.dom.colorPicker.canvas.getContext('2d');
  const canvas = state.dom.colorPicker.canvas;
  canvas.width = metaPixelWidth(2);
  canvas.height = metaPixelWidth(2);
}

const setupColorPickerSliders = (state) => {
  const r = document.getElementById("rSlider");
  const g = document.getElementById("gSlider");
  const b = document.getElementById("bSlider");
  const a = document.getElementById("aSlider");
  const sliders = [r,g,b,a];
  for ( slider in sliders ) {
    renderColorPicker(state)(r.value,g.value,b.value,a.value); 
    sliders[slider].oninput = function () {
      renderColorPicker(state)(r.value,g.value,b.value,a.value); 
    }
  } 
}


const attachLoadColorPickerHandler = (state) => {
  return (callback) => {
    const but = state.dom.colorPicker.canvas; 
    but.onclick = () => loadColorPicker(state)(callback);
  };
}

const attachCollectGarbageHandler = (state) => {
  return (callback) => {
    const g = document.getElementById("collectGarbage");
    g.onclick = () => {
      nullGarbage(state);
      callback(state);
    }
  }
}

const loadColorPicker = (state) => {
  return (callback) => {
    const r = document.getElementById("rSlider");
    const g = document.getElementById("gSlider");
    const b = document.getElementById("bSlider");
    const a = document.getElementById("aSlider");
    const curseX = getPaletteCursor(state); 
    const offsetX = getPaletteOffset(state); 
    const rgba = "rgba(" + r.value + "," + g.value + "," + b.value + "," + a.value/255 + ")";
    log_event( "loadRGBA: " + rgba + " -> " + (curseX + offsetX)) 
    newPaletteBlock(state)(curseX+offsetX,rgba)(() => {
      callback(state) 
    });
  }
}


const setupZipperPalette = (state) => {
//  state.dom.palette.position.grid = document.getElementById("palette.position.canvas");
//  state.dom.palette.position.cursor = document.getElementById("palette.position.cursor");
//  state.dom.palette.complexity = document.getElementById("palette.complexity");
//  state.dom.palette.renderTime = document.getElementById("palette.renderTime");
  const palette = document.getElementById("zipperPalette");
  palette.width  = metaPixelWidth(3);
  palette.height = metaPixelWidth(2);
  state.dom.zipper.ctx = palette.getContext('2d');
  state.dom.zipper.canvas = palette;
}



const setupPalette = (state) => {
  state.dom.palette.position.grid = document.getElementById("palette.position.canvas");
  state.dom.palette.position.cursor = document.getElementById("palette.position.cursor");
  state.dom.palette.complexity = document.getElementById("palette.complexity");
  state.dom.palette.renderTime = document.getElementById("palette.renderTime");
  state.dom.palette.canvas = document.getElementById("palette");
  const palette = state.dom.palette.canvas;
  palette.width  = metaPixelWidth(3);
  palette.height = metaPixelWidth(2);
  state.dom.palette.ctx = palette.getContext('2d');
}

const setup = (state) => {

  return (callback) => {
    setupCanvas(state);
    setupPalette(state);
    setupZipperPalette(state);
    setupMeta2Render(state);
    setupColorPickerRender(state);
    newPaletteBlock(state)(-1,"rgba(0,0,0,0)")(() => {
      callback();
    });
    setupColorPickerSliders(state);
    attachLoadColorPickerHandler(state)((state) => {
      renderEverything(state)
    });
    attachCollectGarbageHandler(state)((state) => {
      renderEverything(state);
    });
  }
}

const clearCanvas = (state,selector) => {
  const ctx = state.dom[selector].ctx;
  const canvas = state.dom[selector].canvas; 
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

const renderEverything = (state) => {
  var rec = document.getElementById("rec");
  if ( paletteInParent(state) ) {
    rec.innerHTML = "*";
  } else {
    rec.innerHTML = "-";
  }
  renderCanvasCoordinates(state);
  renderCursorCoordinates(state);
  renderPaletteCoordinates(state);
  renderComplexities(state);
  renderBorders(state);
  renderImageCache(state);
  renderCanvas(state);
  renderPalette(state);
  renderZipper(state);
  renderRenderTimes(state);
  renderCanvasDisplayLine2(state);
  renderZipperDisplayLine(state);
  autoGarbageCollect(state);
}

const renderCanvas = (state) => {
  const tb = performance.now();
  clearCanvas(state,"canvas");
  renderMetaPixel(state)(state.data.tree.pointer.structure)(3)(state.dom.canvas.ctx);
  if ( state.view.canvas.grid.mode === "on") renderGrid(state,"canvas");
  if ( state.view.canvas.cursor.mode === "on") renderCursor(state,"canvas");
  const te = performance.now();
  state.view.canvas.renderTime = te - tb; 
}

const renderPalette = (state) => {
  log_event("renderPalette");
  const tb = performance.now();
  clearCanvas(state,"palette");
  renderPaletteTiles(state);
  if ( state.view.palette.grid.mode === "on") renderGrid(state,"palette");
  if ( state.view.palette.cursor.mode === "on") renderPaletteCursor(state,"palette");
  const te = performance.now();
  state.view.palette.renderTime = te - tb;
}


const renderZipper = (state) => {
  log_event("render zipper");
  const tb = performance.now();
  clearCanvas(state,"zipper");
  renderZipperVec(state);
  if ( state.view.zipper.grid.mode === "on") renderGrid(state,"zipper");
  if ( state.view.zipper.cursor.mode === "on") renderZipperCursor(state,"zipper");
  const te = performance.now();
  state.view.zipper.renderTime = te - tb;
}

const renderBorders = (state) => {
  const canvas = document.getElementById("canvas.border");
  const palette = document.getElementById("palette.border");
  const zipper = document.getElementById("zipper.border");
  canvas.style.borderColor = "lightgrey";
  palette.style.borderColor = "lightgrey";
  zipper.style.borderColor = "lightgrey";
  switch (state.control.focus) {
    case "canvas":
      canvas.style.borderColor = "red";
      break;
    case "palette":
      palette.style.borderColor = "red";
      break;
    case "zipper":
      zipper.style.borderColor = "red";
  }
}

const renderPaletteCoordinates = (state) => {
  const cursor = state.data.tree.paletteCursor;
  const offset = state.data.tree.paletteOffset;
  setPositionHTML(state)("palette","grid")("");
  setPositionHTML(state)("palette","cursor")("palette : (x=" + offset + ") | cursor : (x=" + cursor + ") |");
}

const renderCursorCoordinates = (state) => {
  const x = state.data.tree.pointer.x;  
  const y = state.data.tree.pointer.y;
  const v2 = strFmtXY(x,y);
  const p = getControlSurfacePositionDisplayText(state)("canvas","cursor");
  const s = getControlSurfaceActiveDisplayText(state)("canvas","cursor"); 
  const html2 = strFmtControlSurfaceCoordinate(p,v2,s);
  setPositionHTML(state)("canvas","cursor")(html2);
}

const renderCanvasCoordinates = (state) => {
  const x = computeCanvasPlanar(state)("x");
  const y = computeCanvasPlanar(state)("y");
  const z = computeCanvasZ(state);
  const v3 = strFmtXYZ(x,y,z);
  const p = getControlSurfacePositionDisplayText(state)("canvas","grid");
  const s = getControlSurfaceActiveDisplayText(state)("canvas","grid"); 
  const html3 = strFmtControlSurfaceCoordinate(p,v3,s);
  setPositionHTML(state)("canvas","grid")(html3);
}


const getControlSurfaceActiveDisplayText = (state) => {
  return (focus,mode) => {
    return state.control.movement[focus].mode === mode ? "*" : "";
  }
}

const getControlSurfacePositionDisplayText = (state) => {
  return (focus,mode) => {
    return state.view[focus][mode].positionDisplay;
  }
}

const getControlSurfaceDimension = (state) => {
  return (focus,mode) => {
    return (dim) => {
      return state.view[focus][mode].position[dim];
    }
  }
}

const controlSurfaceDimensions = (focus,mode) => {
  const dimensions = {
    canvas : {
      grid : 3,
      cursor : 2,
    },
    palette : {
      grid : 1,
      cursor : 1
    }
  };
  return dimensions[focus][mode];
}

const strFmtControlSurfaceCoordinate = (position,vector,active) => {
  return position + " : " + vector + active;
}

const strFmtX = (x) => {
  return "(x=" + x + ")";
}

const strFmtXY = (x,y) => {
  return "(x=" + x + ",y=" + y + ")";
}

const strFmtXYZ = (x,y,z) => {
  return "(x=" + x + ",y=" + y + ",z=" + z + ")";
}

const setPositionHTML = (state) => {
  return (i,m) => {
    return (value) => {
      state.dom[i].position[m].innerHTML = value;
    }
  }
}

const renderComplexity = (state,e) => {
  if ( e === "palette") {
    const complexity = Object.keys(state.data.tree.palette).length;
    state.dom[e].complexity.innerHTML = "complexity = " + complexity;
  }
}

const renderComplexities = (state) => {
  renderComplexity(state,"canvas");
  renderComplexity(state,"palette");
}

const renderRenderTime = (state,e) => {
  const renderTime = state.view[e].renderTime;
  state.dom[e].renderTime.innerHTML = "render = " + renderTime + "ms";
}

const renderRenderTimes = (state) => {
  renderRenderTime(state,"canvas");
  renderRenderTime(state,"palette");
}

const casStructureInsert = (array) => {
  const equalStructures = (a,b) => {
    return b!== null
        && a.render[0] === b.render[0]
        && a.render[1] === b.render[1]
        && a.render[2] === b.render[2]
        && equalMatrix(a.children,b.children);
  }
  
  const equalMatrix = (a,b) => {
    if ( a === undefined ) return true;
    for(var y = 0; y < a[0].length; y++) { 
      for(var x = 0; x < a.length; x++) {
        if (a[y][x] !== b[y][x]) return false;
      }
    }
    return true;
  }
  return (structure) => {
    const i = array.findIndex((x) => equalStructures(structure,x));
    switch (i) {
      case -1:
        return array.push(structure) - 1;
      default:
        return i;
    }
  }
}


const insertRenderCache = (state) => {
  return (render) => {
    return (callback) => {
      const p = casArrayCache(state.data.tree.renderCache[2])( render ); 
      const img = new Image();
      state.data.tree.renderCache["img"][p] = img; 
      img.onload = function() {
        callback(p);
      };
      img.src = render;
    }
  }
}


const newPaletteBlock = (state) => {
  return (index,color) => {
    return (callback) => {
      renderBlockColor(state)(color)((state,ref) => {
        log_event("set palette block color");
        state.data.tree.palette[index] = ref; 
        callback(state);
      });
    }
  }
}

const derefRenderMatrix = (state) => {
  return (structureRef) => {
    return (level) => {
      const refMat= state.data.tree.structure[structureRef].children;
      const renderMat = [];
      for(var y = 0; y < 11; y++) {
        var row = [];
        for(var x = 0; x < 11; x++) {
          const renderRef = state.data.tree.structure[refMat[y][x]].render[level]
          row.push(state.data.tree.renderCache["img"][renderRef]);
        }
        renderMat.push(row);
      }
      renderMat.reverse();
      return renderMat;
    }
  }
}

const renderToImageMatrix = (matrix) => {
  return matrix.map((row) => row.map(render => {
    const img = new Image;
    img.src = render;
    return img;
  }));
}

const joinMatrix11 = (matrix) => {
  var l = []
  for(var y = 0; y < 11; y++) {
    for(var x = 0; x < 11; x++) {
      l.push(matrix[y][x]);
    }
  }
  return l;
}

const getFocusedStructure = (state) => {
  const ptr = state.data.tree.pointer;
  return state.data.tree.structure[ptr.structure].children[ptr.y,ptr.x];
}

const copyFromStructure = (state) => {
  const curseX = getPaletteCursor(state); 
  const gridX = getPaletteOffset(state); 
  const focus = state.data.tree.pointer.structure;
  const x = state.data.tree.pointer.x;
  const y = state.data.tree.pointer.y;
  state.data.tree.palette[gridX + curseX] = state.data.tree.structure[focus].children[5-y][5+x];
  var path = state.data.tree.zipper.map(o => { return { x : o.x, y : o.y } });
  path.push({ x : x, y : y });
  state.data.tree.palettePath[gridX + curseX] = path;
  renderEverything(state);
}




const cursorZipper = (state) => {
  var zipperCopy = state.data.tree.zipper.slice(0,state.data.tree.zipper.length);
  zipperCopy.push(state.data.tree.pointer);
  return zipperCopy;
}

const paletteInParent = (state) => {
  const curseX = getPaletteCursor(state); 
  const gridX = getPaletteOffset(state); 
  const path = state.data.tree.palettePath[gridX + curseX]; 
  const zipper = cursorZipper(state);
  if ( path === undefined ) {
    return false;
  }
  if ( path.length > (zipper.length - 1) ) {
    return false;
  }
  for ( var i = 0; i < path.length; i++ ) {
    if ( path[i].x != zipper[i].x || path[i].y != zipper[i].y ) {
      return false;
    }
  }
  if ( zipper[path.length].structure != state.data.tree.palette[gridX + curseX] ) {    
    return false;
  }  
  return true;
}


const moveDownTree = (state) => {
  const p = state.data.tree.pointer.structure;
  const x = state.data.tree.pointer.x;
  const y = state.data.tree.pointer.y;
  state.data.tree.zipper.push( {
    structure : p
  , x : x
  , y : y
  });

  state.data.tree.pointer.structure = state.data.tree.structure[p].children[5-y][5+x];
  state.data.tree.pointer.x = 0;
  state.data.tree.pointer.y = 0;
}

const getPointedStructure = (state) => {
  return state.data.tree.pointer.structure;
}



const pasteFromPaletteIntoZipper = (state) => {
  log_event("paste");
  const curseX = getPaletteCursor(state); 
  const gridX = getPaletteOffset(state); 
  var o = state.data.tree.palette[gridX + curseX];
  if ( o === undefined ) {
    o = 0;
  }
  const zipper = cursorZipper(state);
  pasteIntoZipper(state)(o)(zipper)((newZipper) => {    
    state.data.tree.pointer = newZipper.pop();
    state.data.tree.pointer.zipper = newZipper;
    renderEverything(state); 
  });
}



const pasteIntoZipper = (state) => {
  return (structureRef) => {
    return (inZipper) => {
      return (callback) => {
        const pointer = inZipper.pop();
        const x = pointer.x;
        const y = pointer.y;
        if ( state.data.tree.structure[pointer.structure].children[5-y][5+x] === structureRef ) {
          inZipper.push(pointer);
          callback(inZipper);
          return; //paste resulted in no change
        }
        var newst = cloneStructure(state)( pointer.structure );
        newst.children[5-y][5+x] = structureRef;
        const newstRef = casStructureInsert(state.data.tree.structure)(newst); 
        renderMetaPixel(state)(newstRef)(2)(state.dom.meta2Render.ctx);
        insertRenderCache(state)( meta2RenderData(state) )((meta2) => { 
          newst.render = { 2 : meta2 }; 
          pointer.structure = newstRef;
          if ( inZipper.length === 0 ) {
            callback([pointer]);
          } else {
            pasteIntoZipper(state)(newstRef)(inZipper)((newZipper) => {
              newZipper.push(pointer);
              callback(newZipper);
            });
          }
        });
      }
    }
  }
}

const moveUpTree = (state) => {
  var p = state.data.tree.zipper.pop();
  if ( p === undefined ) {
    return (callback) => { 
      paste(state)(state.data.tree.pointer.structure)(5,5,0)((structure) => {
        state.data.tree.zeroOffset -= 1; 
        state.data.tree.pointer.structure = structure; 
        state.data.tree.pointer.x = 0;
        state.data.tree.pointer.y = 0;
        callback();
      });
    }
  } else {
    return (callback) => {
      state.data.tree.pointer = {
        structure : p.structure 
      , x : p.x
      , y : p.y
      };
      callback();    
    }
  }
}


const paste = (state) => {
  return (structureRef) => {
    return (y,x,inStructureRef) => {
      return (callback) => {
        if ( state.data.tree.structure[inStructureRef].children[y][x] === structureRef ) {
          callback(inStructureRef);
          return; //paste resulted in no change
        }
        var newst = cloneStructure(state)( inStructureRef );
        newst.children[y][x] = structureRef;
        const newstRef = casStructureInsert(state.data.tree.structure)(newst); 
        renderMetaPixel(state)(newstRef)(2)(state.dom.meta2Render.ctx);
        insertRenderCache(state)( meta2RenderData(state) )((meta2) => { 
          newst.render = { 2 : meta2 }; 
          callback(newstRef);
        });
      }
    }
  }
}



const derefZipperImgVec = (state) => {
  const zipper = cursorZipper(state);
  var vec = [];
  const o = state.data.tree.zipperOffset - 5 - state.data.tree.zeroOffset;
  for (var x = o; x < 11 + o; x++ ) { 
    if ( x >= 0 ) {
      const z = zipper[x];
      if ( z !== undefined ) {
        const s = state.data.tree.structure[z.structure].render[2];
        img = state.data.tree.renderCache["img"][s];
        vec.push(img);
        continue;
      }
    } 
    vec.push(null);
  }
  return vec;
}

const renderZipperVec = (state) => {
  const v = derefZipperImgVec(state);
  const ctx = state.dom.zipper.ctx;
  const m2 = metaPixelWidth(2);
  ctx.clearRect(0,0,m2*11,m2);
  for (var x = 0; x < 11; x++ ) {
    if ( v[x] !== null) {
      ctx.drawImage(v[x],x*m2,0);
    }
  }
}


const renderPaletteTiles = (state) => {
  const ctx = state.dom.palette.ctx;
  const m2 = metaPixelWidth(2);
  const cp = getPaletteOffset(state);
  for ( var xo = -5; xo <= 5; xo++ ) {
    const x = xo + cp;
    if ( state.data.tree.palette[x] !== undefined ) {
      const img = new Image();
      //img.onload = function()  {
      //  ctx.drawImage(img,(5+x)*m2,0);
      //}
      img.src = state.data.tree.renderCache[2][state.data.tree.structure[state.data.tree.palette[x]].render[2]]
      ctx.drawImage(img,(5+xo)*m2,0);

    }
  }
}

const renderMetaPixel = (state) => {
  return (structureRef) => {
    return (scale) => {
      return (ctx) => {
        const m = metaPixelWidth(scale-1);
        const mu = metaPixelWidth(scale);
        ctx.clearRect(0,0,metaPixelWidth(scale),metaPixelWidth(scale));
        const matrix = derefRenderMatrix(state)(structureRef)(2);
        for ( var xo = -5; xo <= 5; xo++ ) {
          for ( var yo = -5; yo <= 5; yo++ ) {
            const img = matrix[5-yo][5+xo];
            if ( img.src !== null ) {
              ctx.drawImage(img,(5+xo)*m,(5+yo)*m,m,m);
            } 
          }
        }
      }
    }
  }
}


const renderColorPicker = (state) => {
  return (r,g,b,a) => {
    const ctx = state.dom.colorPicker.ctx;
    const m2 = metaPixelWidth(2);
    ctx.clearRect(0,0,m2,m2);
    ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a/255 + ")";
    ctx.fillRect(0,0,m2,m2);
  }
}

const getRoot = (state) => {
  if ( state.data.tree.zipper.length > 0 ) {
    return state.data.tree.zipper[0];
  }
  return state.data.tree.pointer;
}

const childSet = (state) => { 
  return (node) => {
    return new Set(joinMatrix11(state.data.tree.structure[node].children));
  }
}

const connectedSet = (state) => {  
  return (s) => {
    return (node) => {
      s.add(node);
      childSet(state)(node).forEach(c => {
        if ( ! s.has(c) ) {
          connectedSet(state)(s)(c).forEach(u => {
            s.add(u);
          });
        }
      });
      return s;
    }
  }
}


const pasteFromZipper = (state) => {
  log_event("paste");
  const curseX = getZipperCursor(state); 
  const gridX = getZipperOffset(state); 
  const q = cursorZipper(state)[curseX  + gridX - state.data.tree.zeroOffset]
  if ( q === undefined ) {
    return;
  }
  const o = q.structure; 
  const zipper = cursorZipper(state);
  pasteIntoZipper(state)(o)(zipper)((newZipper) => {    
    state.data.tree.pointer = newZipper.pop();
    state.data.tree.pointer.zipper = newZipper;
    const l = cursorZipper(state)[curseX + gridX - state.data.tree.zeroOffset];
    const p = state.data.tree.pointer;
    state.data.tree.structure[p.structure].children[5-p.y][5+p.x] = l.structure;
    replaceAllOccurrencesIn (state) (new Set()) (p.structure) (o) (l.structure);
    renderEverything(state); 
  });
}

const renderImageCache = (state) => {
  var connected = []
  connectedToRoot(state).forEach(s => connected.push(state.data.tree.structure[s].render[2]));
  const imgcache = document.getElementById("imgcache");
  imgcache.innerHTML = "";
  Object.keys(state.data.tree.renderCache["img"]).forEach(k => {
    const img = state.data.tree.renderCache["img"][k];
    const container = document.createElement("div");
    img.title = k;
    if ( connected.findIndex(x => x == parseInt(k)) > -1 ) {
      container.style.borderColor = "black";
    } else {
      container.style.borderColor = "lightgrey";
    }
    container.id = "container";
    container.appendChild(img);
    imgcache.appendChild(container);
  });
}

const replaceAllOccurrencesIn = (state) => {
  return (visited) => {
    return (node) => {
      return (match) => {
        return (replace) => {
          visited.add(node);
          for ( var y = 0; y < metaPixelWidth(1); y++) {
            for ( var x = 0; x < metaPixelWidth(1); x++) {
              if ( state.data.tree.structure[node].children[y][x] == match ) {
                state.data.tree.structure[node].children[y][x] = replace;
              } else {
                const child = state.data.tree.structure[node].children[y][x];
                if ( ! visited.has(child) ) {
                  replaceAllOccurrencesIn(state)(visited)(child)(match)(replace);
                }
              }
            }
          }
        }
      }
    }
  }
}

const connectedToRoot = (state) => {
  const root = getRoot(state);
  return connectedSet(state)(new Set())(root.structure);
}


const connectedToRootOrPalette = (state) => {
  const root = getRoot(state);
  var c = connectedSet(state)(new Set())(root.structure);
  Object.values(state.data.tree.palette).forEach( p => {
    c = connectedSet(state)(c)(p);
  });
  return c;
}

const associatedRenders = (state) => {
  return (structures) => {
    var s = new Set();
    structures.forEach(x => s.add(state.data.tree.structure[x].render[2]));
    return s
  }
}

const autoGarbageCollect = (state) => {
  const c = document.getElementById("autoGarbageCollect");
  if ( c.checked ) {
    nullGarbage(state);
  }
}

const nullGarbage = (state) => {
  const c = connectedToRootOrPalette(state);
  const rs = associatedRenders(state)(c);
  for (var i = 0; i < state.data.tree.structure.length; i++ ) {
    if ( !c.has(i) ) {
      if ( state.data.tree.structure[i] != null ) {        
        const r = state.data.tree.structure[i].render[2];
        if ( !rs.has(r) ) {
          delete state.data.tree.renderCache["img"][r];
          state.data.tree.renderCache[2][r] = null;
        }
        state.data.tree.structure[i] = null;
      }
    }
  }
}

const renderCanvasDisplayLine2 = (state) => {
  const d = document.getElementById("canvasTextRow2");
  const c = connectedToRoot(state);
  const structures = "structures = " + c.size;
  const g = state.data.tree.structure.filter(x => x!== null).length - c.size;
  const images = "images = " + Object.keys(state.data.tree.renderCache["img"]).length;
  const l2data = "l2data = " + state.data.tree.renderCache[2].filter(x => x != null)
                                                             .map(x => x.length)
                                                             .reduce((a,x) => a + x);
  const garbage = "garbage = " + g;
  d.innerHTML = garbage + " | " + structures + " | " + images + " | " + l2data + "B"; 
}


const renderZipperDisplayLine = (state) => {
  const d = document.getElementById("zipperTextRow");
  const cursor = "cursor = " + state.data.tree.zipperCursor;
  const offset = "offset = " + state.data.tree.zipperOffset;
  const depth = "depth = " + state.data.tree.zipper.length;
  d.innerHTML = cursor + " | " + offset + " | " + depth; 
}

const renderBlockColor = (state) => {
  const blockMeta2Render = (state) => {
    return (color) => {
      const m2 = metaPixelWidth(2);
      const ctx = state.dom.meta2Render.ctx;
      ctx.fillStyle = color;
      ctx.clearRect(0,0,m2,m2);
      ctx.fillRect(0,0,m2,m2);        
    }
  }
  const blockChildren = (structure) => {
    var m = [];
    for(var x = 0; x < 11; x++) {
      m.push([]);
    }
    for(var x = 0; x < 11; x++) {
      for(var y = 0; y < 11; y++) {
        m[x].push(structure);
      }
    }
    return m;
  }
  return (color) => {
    return (callback) => {    
      blockMeta2Render(state)(color);
      insertRenderCache(state)( meta2RenderData(state) )((meta2) => { 
        const strucRef = casStructureInsert(state.data.tree.structure)( {
            render : { 2 : meta2 } 
          });
        state.data.tree.structure[strucRef].children = blockChildren(strucRef);
        callback(state,strucRef);      
      });
    }
  }
}

const cloneStructure = (state) => {
  return (structureRef) => {
    return {
      render : {
        0 : state.data.tree.structure[structureRef].render[0],
        1 : state.data.tree.structure[structureRef].render[1],
        2 : state.data.tree.structure[structureRef].render[2],
      },
      children : state.data.tree.structure[structureRef].children.map( r => r.slice() )
    };
  }
}




const renderZipperCursor = (state,c) => {
  const m = metaPixelWidth(2);
  const x = state.data.tree.zipperCursor;
  state.dom[c].ctx.strokeStyle = state.view[c].cursor.color;
  state.dom[c].ctx.strokeRect((x + 5)*m, 0, m, m);
}

const renderPaletteCursor = (state,c) => {
  const m = metaPixelWidth(2);
  const x = state.data.tree.paletteCursor;
  state.dom[c].ctx.strokeStyle = state.view[c].cursor.color;
  state.dom[c].ctx.strokeRect((x + 5)*m, 0, m, m);
}

const renderCursor = (state,c) => {
  const m = metaPixelWidth(2);
  const x = state.data.tree.pointer.x;
  const y = state.data.tree.pointer.y;
  state.dom[c].ctx.strokeStyle = state.view[c].cursor.color;
  state.dom[c].ctx.strokeRect((x + 5)*m, -(y - 5)*m, m, m);
}

const renderGridToCtx = (ctx,w,h,color) => {
  const m2 = metaPixelWidth(2); 
  ctx.strokeStyle = color; 
  for(var x = 0; x <= w; x++) {
    ctx.beginPath();
    ctx.moveTo(x*m2,0);
    ctx.lineTo(x*m2,h*m2);
    ctx.stroke();
  }
  for(var y = 0; y <= h; y++) {
    ctx.beginPath();
    ctx.moveTo(0,y*m2);
    ctx.lineTo(w*m2,y*m2);
    ctx.stroke();
  }
}

const renderGrid = (state,c) => {
  const ctx = state.dom[c].ctx; 
  const m  = metaPixelWidth(2);  
  const color = state.view[c].grid.color;
  renderGridToCtx(ctx,m,m,color);
}

const moveCanvasCursor = (state) => {
  return (dx,dy) => {
    const newX = getCanvasCursor(state)("x") + dx; 
    const newY = getCanvasCursor(state)("y") + dy;
    if ( Math.abs(newX) <= 5 ) {
      setCanvasCursor(state)("x")(newX);
    }
    if ( Math.abs(newY) <= 5 ) {
      setCanvasCursor(state)("y")(newY);
    }
  }
}

const getCanvasCursor = (state) => {
  return (dim) => {
    return state.data.tree.pointer[dim];
  }
}

const setCanvasCursor = (state) => {
  return (dim) => {
    return (x) => {
      state.data.tree.pointer[dim] = x;
    }
  }
}

const getPaletteOffset = (state) => {
  return state.data.tree.paletteOffset;
}

const setPaletteOffset = (state) => {
  return (x) => {
    state.data.tree.paletteOffset = x;
  }
}

const movePaletteOffset = (state) => {
  return (dx) => {
    const newX = getPaletteOffset(state) + dx; 
    if ( Math.abs(newX) <= 5 ) {
      setPaletteOffset(state)(newX);
    }
  }
}

const getPaletteCursor = (state) => {
  return state.data.tree.paletteCursor;
}

const setPaletteCursor = (state) => {
  return (x) => {
    state.data.tree.paletteCursor = x;
  }
}

const movePaletteCursor = (state) => {
  return (dx) => {
    const newX = getPaletteCursor(state) + dx; 
    if ( Math.abs(newX) <= 5 ) {
      setPaletteCursor(state)(newX);
    }
  }
}

const getZipperOffset = (state) => {
  return state.data.tree.zipperOffset;
}

const setZipperOffset = (state) => {
  return (x) => {
    state.data.tree.zipperOffset = x;
  }
}

const moveZipperOffset = (state) => {
  return (dx) => {
    const newX = getZipperOffset(state) + dx; 
    setZipperOffset(state)(newX);
  }
}

const getZipperCursor = (state) => {
  return state.data.tree.zipperCursor;
}

const setZipperCursor = (state) => {
  return (x) => {
    state.data.tree.zipperCursor = x;
  }
}

const moveZipperCursor = (state) => {
  return (dx) => {
    const newX = getZipperCursor(state) + dx; 
    if ( Math.abs(newX) <= 5 ) {
      setZipperCursor(state)(newX);
    }
  }
}

const move = (state,d) => {
  log_event(state.control.movement[state.control.focus].mode + " " + d.d);
  const focus = state.control.focus;
  const mode = state.control.movement[state.control.focus].mode;
  switch (focus) {
    case "canvas":
      if ( mode === "cursor" ) {
        moveCanvasCursor(state)(d.x,d.y);
      }
      break;
    case "palette":
      if ( mode === "cursor" ) {
        movePaletteCursor(state)(d.x);
      } else {
        movePaletteOffset(state)(d.x);
      }
      break;
    case "zipper":
      if ( mode === "cursor" ) {
        moveZipperCursor(state)(d.x);
      } else {
        moveZipperOffset(state)(d.x);
      }
      break;
    default:
      break; 
  }
  renderEverything(state);
}


const computeCanvasZ = (state) => {
  return state.data.tree.zeroOffset + state.data.tree.zipper.length;
}

const computeCanvasPlanar = (state) => {
  return (coord) => {
    const local = state.data.tree.pointer[coord];
    const zipper = state.data.tree.zipper;
    if ( zipper.length > 0 ) {
      var c = 0;
      for ( var i = 0; i < zipper.length; i++ ) {
        c = (c + zipper[i][coord])*11;
      }
      return c + local
    }
    return local;
  } 
}

const moveDown = (state) => {
  const focus = state.control.focus;
  if ( focus === "palette" ) return;
  moveDownTree(state);
  renderEverything(state);
}

const moveUp = (state) => {
  const focus = state.control.focus;
  if ( focus === "palette" ) return;
  moveUpTree(state)(() => {
    renderEverything(state);
  });
}

const toggleGrid = (state) => {
  const focus = state.control.focus;
  if ( state.view[focus].grid.mode === "on") {
    state.view[focus].grid.mode = "off";
  } else {
    state.view[focus].grid.mode = "on";
  }
  renderEverything(state);
}

const toggleCursor = (state) => {
  const focus = state.control.focus;
  if ( state.view[focus].cursor.mode === "on") {
    state.view[focus].cursor.mode = "off";
  } else {
    state.view[focus].cursor.mode = "on";
  }
  renderEverything(state);
}

const toggleMovementMode =  (state) => {
  const modes = state.control.movement[state.control.focus].modes; 
  const current = state.control.movement[state.control.focus].mode;
  var next = modes.indexOf(current) + 1;
  if ( next >= modes.length ) next = 0;
  state.control.movement[state.control.focus].mode = modes[next]; 
  renderEverything(state);
}

const toggleFocus = (state) => {
  const foci = state.control.foci;
  const current = state.control.focus;
  var next = foci.indexOf(current) + 1;
  if (next >= foci.length ) next = 0;
  state.control.focus = foci[next];
  renderEverything(state);
}

const handleKeyDown = (state,event) => {
  if ( event.keyCode === 68) move(state,{d : "E", x : +1, y : 0}); 
  if ( event.keyCode === 65) move(state,{d : "W", x : -1, y : 0}); 
  if ( event.keyCode === 87) move(state,{d : "N", x : 0, y : +1}); 
  if ( event.keyCode === 83) move(state,{d : "S", x : 0, y : -1}); 
  if ( event.keyCode === 80) pasteFromPaletteIntoZipper(state);
  if ( event.keyCode === 82) pasteFromZipper(state);
  if ( event.keyCode === 79) copyFromStructure(state);
  if ( event.keyCode === 90) moveDown(state);
  if ( event.keyCode === 88) moveUp(state);    
  if ( event.keyCode === 69) toggleFocus(state);
  if ( event.keyCode === 81) toggleMovementMode(state);
  if ( event.keyCode === 71) toggleGrid(state); 
  if ( event.keyCode === 67) toggleCursor(state); 
  console.log(event.keyCode);
}


/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import '../node_modules/@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/OpenGL/Profiles/All';

import macro from '@kitware/vtk.js/macros';
import Base64 from '@kitware/vtk.js/Common/Core/Base64';
import DataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkSynchronizableRenderWindow from '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow';
import vtkCamera from '@kitware/vtk.js/Rendering/Core/Camera';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';

import styles from './viewer.module.css';
import { w } from '@kitware/vtk.js/macros2';

let autoInit = true;

function emptyContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function onVisible(element, callback) {
    new window.parent.IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.intersectionRatio > 0) {
                callback();
                observer.disconnect();
            }
        });
    }).observe(element);
}

function runOnVisible(callback) {
    if (!window.frameElement) {
        callback();
        return true;
    }
    const visible = window.frameElement.getClientRects().length > 0;
    if (!visible) {
        onVisible(window.frameElement, callback);
    } else {
        callback();
    }
    return visible;
}

export function load(container, options) {
    autoInit = false;
    emptyContainer(container);

    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        background: [1, 1, 0.5],
        rootContainer: container,
        containerStyle: { height: '100%', width: '100%', position: 'absolute' },
    });
    let renderWindow = fullScreenRenderer.getRenderWindow();
    let renderer = fullScreenRenderer.getRenderer(); // Get the renderer
    let camera = renderer.getActiveCamera(); // Get the active camera
    let interactor = renderWindow.getInteractor(); // Get the interactor
    let interactorStyle = interactor.getInteractorStyle();

    let syncCTX = vtkSynchronizableRenderWindow.getSynchronizerContext();
    let syncRW = vtkSynchronizableRenderWindow.decorate(renderWindow);
    window.renderWindow = renderWindow;

    let desiredCamera = vtkCamera.newInstance();
    
    // Set camera properties
    desiredCamera.setPosition(0, 1, 0);
    desiredCamera.setFocalPoint(0, 0, 0);
    desiredCamera.setViewUp(0, 0, -1);

    // Set default camera properties
    //let desiredCameraPosition = [0.11267948247883869, 0.4069797732752285, -0.3530998305333525];
    //let desiredFocalPoint = [-0.02696058176651228, 0.006487687564310618, -0.0033351274026653943];
    //let desiredViewUp = [-0.9652903846706784, 0.23228365317973815, -0.1194101240590961];
    let desiredCameraPosition = [0.13716509309763456, 0.5111986199795905, 0.14573379338372205];
    let desiredFocalPoint = [-0.01549185173439814, 0.05924350092025432, -0.12750791896312408];
    let desiredViewUp = [-0.9329688339918345, 0.35412958598130867, -0.06450884538281568];

    // Function to log camera properties
    function logCameraProperties(cam) {
        let position = cam.getPosition();
        let focalPoint = cam.getFocalPoint();
        let viewUp = cam.getViewUp();
        console.log(`Camera position: [${position[0]}, ${position[1]}, ${position[2]}]`);
        console.log(`Camera focal point: [${focalPoint[0]}, ${focalPoint[1]}, ${focalPoint[2]}]`);
        console.log(`Camera view up: [${viewUp[0]}, ${viewUp[1]}, ${viewUp[2]}]`);
    }

    //interactor.onAnimation(() => {
    //    logCameraProperties(camera);
    //});

    interactorStyle.onEndInteractionEvent(() => {
        const renderers = syncRW.getRenderers();
        // Iterate over each renderer
        for (let i = 0; i < renderers.length; i++) {
            let hui_render = renderers[i];
            let hui_camera = hui_render.getActiveCamera();

            logCameraProperties(hui_camera);
        }
    });
    // Assuming you have access to the renderer and camera
    function setTopView(camera, renderWindow) {
        // Set camera to top view (adjust the position to suit your scene)
        camera.setPosition(0, 3, 0); // Example top-down position
        camera.setFocalPoint(0, 0, 0); // Looking at the origin
        camera.setViewUp([0, 0, -1]); // Adjust the up vector

        window.renderWindow.render(); // Re-render the scene to apply changes
        syncRW.render();
    }

    // Add event listener for keypress
    window.addEventListener('keydown', (event) => {
        const huiRenderer = syncRW.getRenderers()[1];
        const huiCamera = huiRenderer.getActiveCamera();
        if (event.key === 't') {
            // Call your function to set the camera to top view
            setTopView(huiCamera, syncRW);
            huiRenderer.getRenderWindow().render();;
        }
    });

    // Add event listener for keypress
    window.addEventListener('keydown', (event) => {
        const huiRenderer = syncRW.getRenderers()[1];
        const huiCamera = huiRenderer.getActiveCamera();
        if (event.key === 'z') {
            // Call your function to set the camera to top view
            huiCamera.zoom(1.1);
            syncRW.render();
            window.renderWindow.render(); // Re-render the scene to apply changes
        }
    });

    // Add event listener for keypress
    window.addEventListener('keydown', (event) => {
        const huiRenderer = syncRW.getRenderers()[1];
        const huiCamera = huiRenderer.getActiveCamera();
        if (event.key === 'x') {
            // Call your function to set the camera to top view
            huiCamera.zoom(0.9);
            syncRW.render();
            window.renderWindow.render(); // Re-render the scene to apply changes
        }
    });
    // Function to set camera properties
    function setCameraProperties() {
        camera.setPosition(...desiredCameraPosition);
        camera.setFocalPoint(...desiredFocalPoint);
        camera.setViewUp(...desiredViewUp);
        renderWindow.render(); // Trigger a render to apply the camera changes
    }

    function onReady(data) {

        syncCTX.setFetchArrayFunction((sha) =>
            Promise.resolve(data.hashes[sha].content)
        );

        console.log(Object.keys(data));
        console.log(Object.keys(data.scene));
        syncRW.synchronize(data.scene);

        syncRW.removeRenderer(syncRW.getRenderers()[2]);
        const huiRenderer = syncRW.getRenderers()[1];
        const huiCamera = huiRenderer.getActiveCamera();
        huiRenderer.setBackground(1,0.5,0.5);
        huiCamera.setPosition(...desiredCameraPosition);
        huiCamera.setFocalPoint(...desiredFocalPoint);
        huiCamera.setViewUp(...desiredViewUp);
        huiCamera.orthogonalizeViewUp();
        huiRenderer.resetCameraClippingRange();
        //for (let i = 0; i < huiRenderer.getActors().length; i++)
        //{
        //    let actor = huiRenderer.getActors()[i];
        //    //console.log(Object.keys(actor));
        //    console.log(actor.getVisibility());
        //    //actor.getVisibility();
        //}

        huiRenderer.removeActor(huiRenderer.getActors()[1]);

        huiRenderer.getRenderWindow().render();
        huiRenderer.resetCamera();

        syncRW.render();
        huiRenderer.getRenderWindow().render();
        window.renderWindow.render()
    }


    if (options.fileURL || options.url) {
        console.log('Huiyu1');
        const progressContainer = document.createElement('div');
        progressContainer.setAttribute('class', styles.progress);
        container.appendChild(progressContainer);

        const progressCallback = (progressEvent) => {
            if (progressEvent.lengthComputable) {
                const percent = Math.floor(
                    (100 * progressEvent.loaded) / progressEvent.total
                );
                progressContainer.innerHTML = `Loading ${percent}%`;
            } else {
                progressContainer.innerHTML = macro.formatBytesToProperUnit(
                    progressEvent.loaded
                );
            }
        };

        if (options.fileURL) {
            HttpDataAccessHelper.fetchBinary(options.fileURL, {
                progressCallback,
            }).then((zipContent) => {
                container.removeChild(progressContainer);
                const dataAccessHelper = DataAccessHelper.get('zip', {
                    zipContent,
                    callback: (zip) => {
                        dataAccessHelper.fetchJSON(null, 'index.json').then(onReady);
                    },
                });
            });
        } else {
            HttpDataAccessHelper.fetchJSON(options.url, {
                progressCallback,
            }).then((data) => {
                container.removeChild(progressContainer);
                onReady(data);
            });
        }
    } else if (options.file) {
        //console.log('Huiyu2');
        const dataAccessHelper = DataAccessHelper.get('zip', {
            zipContent: options.file,
            callback: (zip) => {
                dataAccessHelper.fetchJSON(null, 'index.json').then(onReady);
            },
        });
    } else if (options.base64Str) {
        console.log('Huiyu3');
        const zipContent = Base64.toArrayBuffer(options.base64Str);
        const dataAccessHelper = DataAccessHelper.get('zip', {
            zipContent,
            callback: (zip) => {
                dataAccessHelper.fetchJSON(null, 'index.json').then(onReady);
            },
        });
    }
}

export function initLocalFileLoader(container) {
    autoInit = false;
    const exampleContainer = document.querySelector('.content');
    const rootBody = document.querySelector('body');
    const myContainer = container || exampleContainer || rootBody;

    if (myContainer !== container) {
        myContainer.classList.add(styles.fullScreen);
        rootBody.style.margin = '0';
        rootBody.style.padding = '0';
    } else {
        rootBody.style.margin = '0';
        rootBody.style.padding = '0';
    }

    const fileContainer = document.createElement('div');
    fileContainer.classList.add('box')
    fileContainer.innerHTML = `<div class="${styles.bigFileDrop}"/><input type="file" accept=".zip,.vtksz" style="display: none;"/>`;
    myContainer.appendChild(fileContainer);

    const fileInput = fileContainer.querySelector('input');

    function handleFile(e) {
        preventDefaults(e);
        const dataTransfer = e.dataTransfer;
        const files = e.target.files || dataTransfer.files;
        if (files.length === 1) {
            myContainer.removeChild(fileContainer);
            const ext = files[0].name.split('.').slice(-1)[0];
            load(myContainer, { file: files[0], ext });
        }
    }

    fileInput.addEventListener('change', handleFile);
    fileContainer.addEventListener('drop', handleFile);
    fileContainer.addEventListener('click', (e) => fileInput.click());
    fileContainer.addEventListener('dragover', preventDefaults);
}

const userParams = vtkURLExtract.extractURLParameters();

if (userParams.url || userParams.fileURL) {
    const exampleContainer = document.querySelector('.content');
    const rootBody = document.querySelector('body');
    const myContainer = exampleContainer || rootBody;
    if (myContainer) {
        myContainer.classList.add(styles.fullScreen);
        rootBody.style.margin = '0';
        rootBody.style.padding = '0';
    }

    autoInit = false;
    runOnVisible(() => load(myContainer, userParams));
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
    if (autoInit) {
        initLocalFileLoader();
    }
}, 100);

window.OfflineLocalView = {
    initLocalFileLoader,
    load,
};


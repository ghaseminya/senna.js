'use strict';

import core from 'bower:metal/src/core';
import dom from 'bower:metal/src/dom/dom';
import Surface from '../../src/surface/Surface';
import CancellablePromise from 'bower:metal-promise/src/promise/Promise';

describe('Surface', function() {

	describe('Constructor', function() {
		it('should throws error when surface id not specified', function() {
			assert.throws(function() {
				new Surface();
			}, Error);
		});

		it('should not throw error when surface id specified', function() {
			assert.doesNotThrow(function() {
				new Surface('id');
			});
		});
	});

	describe('Surfaces', function() {
		it('should create surface child when adding screen content to surface', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			assert.ok(core.isElement(surfaceChild));
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should create surface child when adding screen content to surface outside document', function() {
			var surface = new Surface('virtualSurfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			assert.strictEqual('content', surfaceChild.innerHTML);
		});

		it('should get surface child when adding screen content to surface without content', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			assert.ok(core.isElement(surfaceChild));
			assert.strictEqual(surfaceChild, surface.addContent('screenId'));
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should add screen content to surface child', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			assert.strictEqual('content', surfaceChild.innerHTML);
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should surface child be inserted into surface element', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			assert.strictEqual(surface.getElement(), surfaceChild.parentNode);
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should surface child enter document invisible', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			assert.strictEqual('none', surfaceChild.style.display);
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should surface child become visible for its screen', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			surface.show('screenId');
			assert.strictEqual('block', surfaceChild.style.display);
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should only one surface child be visible at time', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			surface.show('screenId');
			var surfaceChildNext = surface.addContent('screenNextId', 'content');
			assert.strictEqual('none', surfaceChildNext.style.display);
			surface.show('screenNextId');
			assert.strictEqual('none', surfaceChild.style.display);
			assert.strictEqual('block', surfaceChildNext.style.display);
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should remove screen content from surface child', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			surface.addContent('screenId', 'content');
			surface.remove('screenId');
			assert.strictEqual(null, surface.getChild('screenId'));
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should remove screen content from surface child outside document', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			surface.remove('screenId');
			assert.strictEqual(null, surface.getChild('screenId'));
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should create surface child relating surface id and screen id', function() {
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.createChild('screenId');
			assert.strictEqual('surfaceId-screenId', surfaceChild.id);
		});

		it('should get surface element by surfaceId', function() {
			var surfaceElement = enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			assert.strictEqual(surfaceElement, surface.getElement());
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should get surface id', function() {
			var surface = new Surface('surfaceId');
			assert.strictEqual('surfaceId', surface.getId());
			surface.setId('otherId');
			assert.strictEqual('otherId', surface.getId());
		});

		it('should show default surface child if screen id not found and hide when found', function() {
			var defaultChild = enterDocumentSurfaceElement('surfaceId-default');
			enterDocumentSurfaceElement('surfaceId').appendChild(defaultChild);
			var surface = new Surface('surfaceId');
			surface.show('screenId');
			var surfaceChild = surface.addContent('screenId', 'content');
			assert.strictEqual('none', surfaceChild.style.display);
			assert.strictEqual('block', defaultChild.style.display);
			surface.show('screenId');
			assert.strictEqual('block', surfaceChild.style.display);
			assert.strictEqual('none', defaultChild.style.display);
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should be able to overwrite default transition', function() {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			surface.addContent('screenId', 'content');
			var transitionFn = sinon.stub();
			surface.setTransitionFn(transitionFn);
			surface.show('screenId');
			assert.strictEqual(1, transitionFn.callCount);
			assert.strictEqual(transitionFn, surface.getTransitionFn());
			exitDocumentSurfaceElement('surfaceId');
		});

		it('should be able to wait deferred transition before removing visible surface child', function(done) {
			enterDocumentSurfaceElement('surfaceId');
			var surface = new Surface('surfaceId');
			var surfaceChild = surface.addContent('screenId', 'content');
			var surfaceChildNext = surface.addContent('screenNextId', 'content');
			var transitionFn = function() {
				return CancellablePromise.resolve();
			};
			surface.setTransitionFn(transitionFn);
			surface.show('screenId');
			surface.show('screenNextId').then(function() {
				assert.ok(!surfaceChild.parentNode);
				assert.ok(surfaceChildNext.parentNode);
				done();
			});
			assert.ok(surfaceChild.parentNode);
			assert.ok(surfaceChildNext.parentNode);
			exitDocumentSurfaceElement('surfaceId');
		});
	});

	it('should evaluate scripts when adding screen content to surface', function() {
		enterDocumentSurfaceElement('surfaceId');
		var surface = new Surface('surfaceId');
		surface.addContent('screenId', '<script>window.sentinel=true;</script>');
		assert.ok(window.sentinel);
		exitDocumentSurfaceElement('surfaceId');
	});

});

function enterDocumentSurfaceElement(surfaceId) {
	dom.enterDocument('<div id="' + surfaceId + '"></div>');
	return document.getElementById(surfaceId);
}

function exitDocumentSurfaceElement(surfaceId) {
	return dom.exitDocument(document.getElementById(surfaceId));
}
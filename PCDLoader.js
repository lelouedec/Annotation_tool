/**
 * @author Filipe Caixeta / http://filipecaixeta.com.br
 * @author Mugen87 / https://github.com/Mugen87
 *
 * Description: A THREE loader for PCD ascii and binary files.
 *
 * Limitations: Compressed binary files are not supported.
 *
 */

// import {
// 	BufferGeometry,
// 	DefaultLoadingManager,
// 	FileLoader,
// 	Float32BufferAttribute,
// 	LoaderUtils,
// 	Points,
// 	PointsMaterial,
// 	VertexColors
// } from "../../../build/three.module.js";
import * as THREE from "./three.module.js";


var PCDLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;
	this.littleEndian = true;

};


PCDLoader.prototype = {

	constructor: PCDLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.FileLoader( scope.manager );
		loader.setPath( scope.path );
		loader.setResponseType( 'arraybuffer' );
		loader.load( url, function ( data ) {

			try {

				onLoad( scope.parse( data, url ) );

			} catch ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					throw e;

				}

			}

		}, onProgress, onError );

	},

	setPath: function ( value ) {

		this.path = value;
		return this;

	},

	parse: function ( data, url ) {

		function parseHeader( data ) {

			var PCDheader = {};
			var result1 = data.search( /[\r\n]DATA\s(\S*)\s/i );
			var result2 = /[\r\n]DATA\s(\S*)\s/i.exec( data.substr( result1 - 1 ) );
			if(!result2){
				alert(`could not load file sorry :(`);
			}
			PCDheader.data = result2[ 1 ];
			PCDheader.headerLen = result2[ 0 ].length + result1;
			PCDheader.str = data.substr( 0, PCDheader.headerLen );

			// remove comments

			PCDheader.str = PCDheader.str.replace( /\#.*/gi, '' );

			// parse

			PCDheader.version = /VERSION (.*)/i.exec( PCDheader.str );
			PCDheader.fields = /FIELDS (.*)/i.exec( PCDheader.str );
			PCDheader.size = /SIZE (.*)/i.exec( PCDheader.str );
			PCDheader.type = /TYPE (.*)/i.exec( PCDheader.str );
			PCDheader.count = /COUNT (.*)/i.exec( PCDheader.str );
			PCDheader.width = /WIDTH (.*)/i.exec( PCDheader.str );
			PCDheader.height = /HEIGHT (.*)/i.exec( PCDheader.str );
			PCDheader.viewpoint = /VIEWPOINT (.*)/i.exec( PCDheader.str );
			PCDheader.points = /POINTS (.*)/i.exec( PCDheader.str );

			// evaluate

			if ( PCDheader.version !== null )
				PCDheader.version = parseFloat( PCDheader.version[ 1 ] );

			if ( PCDheader.fields !== null )
				PCDheader.fields = PCDheader.fields[ 1 ].split( ' ' );

			if ( PCDheader.type !== null )
				PCDheader.type = PCDheader.type[ 1 ].split( ' ' );

			if ( PCDheader.width !== null )
				PCDheader.width = parseInt( PCDheader.width[ 1 ] );

			if ( PCDheader.height !== null )
				PCDheader.height = parseInt( PCDheader.height[ 1 ] );

			if ( PCDheader.viewpoint !== null )
				PCDheader.viewpoint = PCDheader.viewpoint[ 1 ];

			if ( PCDheader.points !== null )
				PCDheader.points = parseInt( PCDheader.points[ 1 ], 10 );

			if ( PCDheader.points === null )
				PCDheader.points = PCDheader.width * PCDheader.height;

			if ( PCDheader.size !== null ) {

				PCDheader.size = PCDheader.size[ 1 ].split( ' ' ).map( function ( x ) {

					return parseInt( x, 10 );

				} );

			}

			if ( PCDheader.count !== null ) {

				PCDheader.count = PCDheader.count[ 1 ].split( ' ' ).map( function ( x ) {

					return parseInt( x, 10 );

				} );

			} else {

				PCDheader.count = [];

				for ( var i = 0, l = PCDheader.fields.length; i < l; i ++ ) {

					PCDheader.count.push( 1 );

				}

			}

			PCDheader.offset = {};

			var sizeSum = 0;

			for ( var i = 0, l = PCDheader.fields.length; i < l; i ++ ) {

				if ( PCDheader.data === 'ascii' ) {

					PCDheader.offset[ PCDheader.fields[ i ] ] = i;

				} else {

					PCDheader.offset[ PCDheader.fields[ i ] ] = sizeSum;
					sizeSum += PCDheader.size[ i ];

				}

			}

			// for binary only

			PCDheader.rowSize = sizeSum;

			return PCDheader;

		}

		var textData = THREE.LoaderUtils.decodeText( new Uint8Array( data ) );

		// parse header (always ascii format)

		var PCDheader = parseHeader( textData );
    	var geometry = new THREE.Geometry();

		// parse data

		var position = [];
		var normal = [];
		var color = [];

		// ascii

		if ( PCDheader.data === 'ascii' ) {

			var offset = PCDheader.offset;
			var pcdData = textData.substr( PCDheader.headerLen );
			var lines = pcdData.split( '\n' );

			for ( var i = 0, l = lines.length; i < l; i ++ ) {

				if ( lines[ i ] === '' ) continue;

				var line = lines[ i ].split( ' ' );

				if ( offset.x !== undefined ) {

					// position.push( parseFloat( line[ offset.x ] ) );
					// position.push( parseFloat( line[ offset.y ] ) );
					// position.push( parseFloat( line[ offset.z ] ) );
          geometry.vertices.push(new THREE.Vector3(line[ offset.x ],line[ offset.y],line[ offset.z ] ) );

				}

				if ( offset.rgb !== undefined ) {

					var rgb = parseFloat( line[ offset.rgb ] );
					var r = ( rgb >> 16 ) & 0x0000ff;
					var g = ( rgb >> 8 ) & 0x0000ff;
					var b = ( rgb >> 0 ) & 0x0000ff;
					// color.push( r / 255, g / 255, b / 255 );
          geometry.colors.push(new THREE.Color(  r / 255, g / 255, b / 255 ) );

				}

				if ( offset.normal_x !== undefined ) {

					normal.push( parseFloat( line[ offset.normal_x ] ) );
					normal.push( parseFloat( line[ offset.normal_y ] ) );
					normal.push( parseFloat( line[ offset.normal_z ] ) );

				}

			}

		}

		// binary

		if ( PCDheader.data === 'binary_compressed' ) {

			console.error( 'THREE.PCDLoader: binary_compressed files are not supported' );
			return;

		}

		if ( PCDheader.data === 'binary' ) {

			var dataview = new DataView( data, PCDheader.headerLen );
			var offset = PCDheader.offset;

			for ( var i = 0, row = 0; i < PCDheader.points; i ++, row += PCDheader.rowSize ) {

				if ( offset.x !== undefined ) {

					// position.push( dataview.getFloat32( row + offset.x, this.littleEndian ) );
					// position.push( dataview.getFloat32( row + offset.y, this.littleEndian ) );
					// position.push( dataview.getFloat32( row + offset.z, this.littleEndian ) );
          geometry.vertices.push(new THREE.Vector3(dataview.getFloat32( row + offset.x, this.littleEndian ),dataview.getFloat32( row + offset.y, this.littleEndian ),dataview.getFloat32( row + offset.z, this.littleEndian ) ) );

				}

				if ( offset.rgb !== undefined ) {

					// color.push( dataview.getUint8( row + offset.rgb + 2 ) / 255.0 );
					// color.push( dataview.getUint8( row + offset.rgb + 1 ) / 255.0 );
					// color.push( dataview.getUint8( row + offset.rgb + 0 ) / 255.0 );
          geometry.colors.push(new THREE.Color(  dataview.getUint8( row + offset.rgb + 2 ) / 255.0, dataview.getUint8( row + offset.rgb + 1 ) / 255.0, dataview.getUint8( row + offset.rgb + 0 ) / 255.0 ) );
				}else{
					geometry.colors.push(new THREE.Color(  0.60,0.6,0.6) );
	
				}

				// if ( offset.normal_x !== undefined ) {
        //
				// 	normal.push( dataview.getFloat32( row + offset.normal_x, this.littleEndian ) );
				// 	normal.push( dataview.getFloat32( row + offset.normal_y, this.littleEndian ) );
				// 	normal.push( dataview.getFloat32( row + offset.normal_z, this.littleEndian ) );
        //
				// }

			}

		}

		// build geometry

    //
		// if ( position.length > 0 ) geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( position, 3 ) );
		// // if ( normal.length > 0 ) geometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normal, 3 ) );
		// if ( color.length > 0 ) geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( color, 3 ) );
		console.log(geometry);
		geometry.computeBoundingSphere();
		geometry.computeBoundingBox();

		var material = new THREE.PointsMaterial( { size : 0.05,vertexColors: THREE.VertexColors } );
		var points  = new THREE.Points( geometry, material );

		return points;
  }
  //
  //   var geom = new THREE.Geometry();
  //   var material = new THREE.PointsMaterial( { size : sized,vertexColors: THREE.VertexColors } );
  //   var range = 10;
  //   for (var i = 0; i < 3; i++) {
  //       var particle = new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2, Math.random() * range - range / 2);
  //       geom.vertices.push(particle);
  //       var color = new THREE.Color(0x00ff00);
  //       geom.colors.push(color);
  //   }
  //   return new THREE.Points(geom, material);
  //
	// }

};

export { PCDLoader };

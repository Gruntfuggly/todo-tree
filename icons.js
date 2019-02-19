var path = require( "path" );
var fs = require( 'fs' );
var octicons = require( 'octicons' );

var utils = require( './utils.js' );
var highlights = require( './highlights.js' );

function getIcon( context, tag )
{
    var colour = highlights.getIconColour( tag );

    var darkIconPath = context.asAbsolutePath( path.join( "resources/icons", "dark", "todo-green.svg" ) );
    var lightIconPath = context.asAbsolutePath( path.join( "resources/icons", "light", "todo-green.svg" ) );

    var colourName = utils.isHexColour( colour.substr( 1 ) ) ? colour.substr( 1 ) : colour;

    var iconName = highlights.getIcon( tag );

    if( iconName )
    {
        if( !octicons[ iconName ] )
        {
            iconName = "check";
        }

        if( !fs.existsSync( context.globalStoragePath ) )
        {
            fs.mkdirSync( context.globalStoragePath );
        }

        if( context.globalStoragePath )
        {
            var octiconIconPath = path.join( context.globalStoragePath, "todo-" + iconName + "-" + colourName + ".svg" );
            if( !fs.existsSync( octiconIconPath ) )
            {
                var octiconIconDefinition = "<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>\n" +
                    octicons[ iconName ].toSVG( { "xmlns": "http://www.w3.org/2000/svg", "fill": colour } );

                fs.writeFileSync( octiconIconPath, octiconIconDefinition );
            }

            darkIconPath = octiconIconPath;
            lightIconPath = octiconIconPath;
        }
    }
    else if( utils.isHexColour( colour.substr( 1 ) ) )
    {
        var colouredIconPath = path.join( context.globalStoragePath, "todo-" + colourName + ".svg" );
        if( !fs.existsSync( colouredIconPath ) )
        {
            if( !fs.existsSync( context.globalStoragePath ) )
            {
                fs.mkdirSync( context.globalStoragePath );
            }

            var colouredIconDefinition =
                "<?xml version=\"1.0\" encoding=\"iso-8859-1\"?>" +
                "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"" +
                "\tviewBox=\"0 0 426.667 426.667\" style=\"enable-background:new 0 0 426.667 426.667;\" xml:space=\"preserve\">" +
                "<path style=\"fill:" + colour + ";\" d=\"M213.333,0C95.518,0,0,95.514,0,213.333s95.518,213.333,213.333,213.333" +
                "\tc117.828,0,213.333-95.514,213.333-213.333S331.157,0,213.333,0z M174.199,322.918l-93.935-93.931l31.309-31.309l62.626,62.622" +
                "\tl140.894-140.898l31.309,31.309L174.199,322.918z\"/>" +
                "</svg>";

            fs.writeFileSync( colouredIconPath, colouredIconDefinition );
        }

        darkIconPath = colouredIconPath;
        lightIconPath = colouredIconPath;
    }
    else if( highlights.getColourList().indexOf( colourName ) > -1 )
    {
        darkIconPath = context.asAbsolutePath( path.join( "resources/icons", "dark", "todo-" + colour + ".svg" ) );
        lightIconPath = context.asAbsolutePath( path.join( "resources/icons", "light", "todo-" + colour + ".svg" ) );
    }

    var icon = {
        dark: darkIconPath,
        light: lightIconPath
    };

    return icon;
}

module.exports.getIcon = getIcon;

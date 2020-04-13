var vscode = require( 'vscode' );
var path = require( "path" );
var fs = require( 'fs' );
var octicons = require( 'octicons' );

var colours = require( './colours.js' );
var utils = require( './utils.js' );
var attributes = require( './attributes.js' );

function getIcon( context, tag )
{
    var colour = attributes.getIconColour( tag );

    var darkIconPath = context.asAbsolutePath( path.join( "resources/icons", "dark", "todo-green.svg" ) );
    var lightIconPath = context.asAbsolutePath( path.join( "resources/icons", "light", "todo-green.svg" ) );

    var colourName = utils.isHexColour( colour.substr( 1 ) ) ? colour.substr( 1 ) : colour;

    var iconName = attributes.getIcon( tag );

    if( !fs.existsSync( context.globalStoragePath ) )
    {
        fs.mkdirSync( context.globalStoragePath );
    }

    if( iconName === 'todo-tree' || iconName === 'todo-tree-filled' )
    {
        var colouredTodoTreeIconPath = path.join( context.globalStoragePath, iconName + "-" + colourName + ".svg" );
        if( !fs.existsSync( colouredTodoTreeIconPath ) )
        {
            var colouredTodoTreeIconDefinition = ( iconName === 'todo-tree' ) ?
                ( "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
                    "<path d=\"M10.5268 1.22702C9.9895 1.4678 9.2269 2.20732 8.91492 2.79206C8.75894 3.08443 8.58562 3.13603 7.61503 3.08443C6.28048 3.01564 5.50054 3.30801 4.72061 4.18512C4.02733 4.97624 3.76736 6.00813 3.99267 7.00563L4.18332 7.77955L3.35139 8.50188C1.27156 10.3077 1.65287 13.541 4.07933 14.6589C4.56462 14.8996 5.10191 15.0888 5.27523 15.0888C5.43122 15.0888 5.70853 15.364 5.89918 15.6907C6.48846 16.671 8.30831 17.1354 9.48688 16.6023C10.0068 16.3615 10.1455 16.4991 10.4401 17.4794C10.6654 18.3221 10.2321 20.3859 9.50421 21.8305L8.91492 23H12.0347C14.4611 23 15 23 15 23L14.41 21.8305C13.68 20.39 13.6292 19.6979 13.4732 18.4253C13.3865 17.5998 13.4212 17.2386 13.6292 16.8258C13.9065 16.2927 13.9238 16.2927 14.4265 16.5507C15.605 17.1526 17.4769 16.7054 18.1008 15.6907C18.2915 15.364 18.5688 15.0888 18.7248 15.0888C18.8981 15.0888 19.4354 14.8996 19.9207 14.6589C22.3471 13.541 22.7284 10.3077 20.6486 8.50188L19.8167 7.77955L20.0073 7.00563C20.2326 6.00813 19.9727 4.97624 19.2794 4.18512C18.4995 3.30801 17.7195 3.01564 16.4023 3.08443C15.3277 3.13603 15.2757 3.11883 14.9638 2.62008C14.5478 1.93215 13.9238 1.39901 13.3346 1.17543C12.6586 0.917456 11.1507 0.951852 10.5268 1.22702Z\" stroke=\"" + colour + "\" stroke-width=\"1.5\" stroke-linejoin=\"bevel\" />" +
                    "<path d=\"M7 9.5L10.5 13L16.5 7\" stroke=\"" + colour + "\" stroke-width=\"1.5\" /></svg>" ) :
                ( "<?xml version=\"1.0\" standalone=\"no\"?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 20010904//EN\" \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">" +
                    "<svg version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\" width=\"28\" height=\"28\" viewBox=\"0 0 128.000000 128.000000\" preserveAspectRatio=\"xMidYMid meet\">" +
                    "<g transform=\"translate(0.000000,128.000000) scale(0.100000,-0.100000)\" fill=\"" + colour + "\" stroke=\"none\">" +
                    "<path d=\"M555 1266 c-31 -14 -75 -57 -93 -91 -9 -17 -19 -20 -75 -17 -77 4 -122 -13 -167 -64 -40 -46 -55 -106 -42 -164 l11 -45 -48 -42 c-120 -105 -98 -293 42 -358 28 -14 59 -25 69 -25 9 0 25 -16 36 -35 34 -57 139 -84 207 -53 30 14 38 6 55 -51 13 -49 -12 -169 -54 -253 l-34 -68 180 0 c140 0 178 3 172 12 -4 7 -15 24 -24 38 -24 34 -56 142 -65 216 -5 48 -3 69 9 93 16 31 17 31 46 16 68 -35 176 -9 212 50 11 19 27 35 36 35 10 0 41 11 69 25 140 65 162 " +
                    "253 42 358 l-48 42 11 45 c13 58 -2 118 -42 164 -45 51 -90 68 -166 64 -62 -3 -65 -2 -83 27 -24 40 -60 71 -94 84 -39 15 -126 13 -162 -3z m330 -236 c4 -6 -25 -45 -65 -86 -84 -89 -152 -190 -200 -297 -19 -42 -37 -77 -40 -77 -3 0 -18 23 -34 52 -16 28 -53 79 -82 114 -45 53 -51 64 -38 74 11 10 24 9 62 -5 26 -10 53 -22 60 -28 9 -7 42 21 125 106 133 137 193 178 212 147z\"/> </g></svg>" );

            fs.writeFileSync( colouredTodoTreeIconPath, colouredTodoTreeIconDefinition );
        }

        darkIconPath = colouredTodoTreeIconPath;
        lightIconPath = colouredTodoTreeIconPath;
    }
    else if( iconName && iconName.trim().substr( 0, 2 ) === "$(" )
    {
        return new vscode.ThemeIcon( iconName.trim().substr( 2, iconName.trim().length - 3 ) );
    }
    else if( iconName )
    {
        if( !octicons[ iconName ] )
        {
            iconName = "check";
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
            var colouredIconDefinition =
                "<svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">" +
                "<path d=\"M11.1924 5.06738L11.8076 5.68262L6.6875 10.8027L4.19238 8.30762L4.80762 7.69238L6.6875 9.57227L11.1924 5.06738ZM8 1C8.64258 1 9.26237 1.08431 9.85938 1.25293C10.4564 1.41699 11.0146 1.65169 11.5342 1.95703C12.0537 2.25781 12.5254 2.6224 12.9492 3.05078C13.3776 3.47461 13.7422 3.94629 14.043 4.46582C14.3483 4.98535 14.583 5.54362 14.7471 6.14062C14.9157 6.73763 15 7.35742 15 8C15 8.64258 14.9157 9.26237 14.7471 9.85938C14.583 10.4564 14.3483 11.0146 14.043 11.5342C13.7422 12.0537 13.3776 12.5277 12.9492 12.9561C12.5254 13.3799 12.0537 13.7445 11.5342 14.0498C11.0146 14.3506 10.4564 14.5853 9.85938 14.7539C9.26237 14.918 8.64258 15 8 15C7.35742 15 6.73763 14.918 6.14062 14.7539C5.54362 14.5853 4.98535 14.3506 4.46582 14.0498C3.94629 13.7445 3.47233 13.3799 3.04395 12.9561C2.62012 12.5277 2.25553 12.0537 1.9502 11.5342C1.64941 11.0146 1.41471 10.4587 1.24609 9.86621C1.08203 9.26921 1 8.64714 1 8C1 7.35742 1.08203 6.73763 1.24609 6.14062C1.41471 5.54362 1.64941 4.98535 1.9502 4.46582C2.25553 3.94629 2.62012 3.47461 3.04395 3.05078C3.47233 2.6224 3.94629 2.25781 4.46582 1.95703C4.98535 1.65169 5.54134 1.41699 6.13379 1.25293C6.73079 1.08431 7.35286 1 8 1ZM8 14.125C8.56055 14.125 9.10059 14.0521 9.62012 13.9062C10.1442 13.7604 10.6318 13.5553 11.083 13.291C11.5387 13.0221 11.9535 12.7008 12.3271 12.3271C12.7008 11.9535 13.0199 11.541 13.2842 11.0898C13.5531 10.6341 13.7604 10.1465 13.9062 9.62695C14.0521 9.10742 14.125 8.5651 14.125 8C14.125 7.43945 14.0521 6.89941 13.9062 6.37988C13.7604 5.85579 13.5531 5.36816 13.2842 4.91699C13.0199 4.46126 12.7008 4.04655 12.3271 3.67285C11.9535 3.29915 11.5387 2.98014 11.083 2.71582C10.6318 2.44694 10.1442 2.23958 9.62012 2.09375C9.10059 1.94792 8.56055 1.875 8 1.875C7.43945 1.875 6.89714 1.94792 6.37305 2.09375C5.85352 2.23958 5.36589 2.44694 4.91016 2.71582C4.45898 2.98014 4.04655 3.29915 3.67285 3.67285C3.29915 4.04655 2.97786 4.46126 2.70898 4.91699C2.44466 5.36816 2.23958 5.85579 2.09375 6.37988C1.94792 6.89941 1.875 7.43945 1.875 8C1.875 8.56055 1.94792 9.10286 2.09375 9.62695C2.23958 10.1465 2.44466 10.6341 2.70898 11.0898C2.97786 11.541 3.29915 11.9535 3.67285 12.3271C4.04655 12.7008 4.45898 13.0221 4.91016 13.291C5.36589 13.5553 5.85352 13.7604 6.37305 13.9062C6.89258 14.0521 7.4349 14.125 8 14.125Z\"" +
                " fill=\"" + colour + "\" /></svg>";

            fs.writeFileSync( colouredIconPath, colouredIconDefinition );
        }

        darkIconPath = colouredIconPath;
        lightIconPath = colouredIconPath;
    }
    else if( colours.getColourList().indexOf( colourName ) > -1 )
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

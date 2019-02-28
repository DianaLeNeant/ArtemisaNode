var db = require('db');
module.exports = {
    home: 'notif',
    current: 'home',
    Page: function(section, callBack, filter = null, userID = 1) {
        var queries = [];
        if (filter == null) {
            filter = {
                column: '',
                filter: ''
            }
        }
        this.current = section;
        switch (section) {
            case 'home':
                this.Home(callBack, filter);
                break;
            case 'dir':
                callBack({command: 'directory'})
                break;
            case 'notif':
                callBack({command: 'myNotif'})
                break;
            case 'inv':
                callBack({command: 'inventory'})
                break;
            case "store":
                queries.push(['SELECT * FROM sucursales {where};', (filter.column == 'LSucursal' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'LSucursal']);
                queries.push(['SELECT ID, Nombre FROM cmm_lInternas {where};', (filter.column == 'LInterna' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'LInterna']);
                queries.push(['SELECT ID, Producto, Cantidad, LSucursal, LInterna, SKU, Serie, Notas, Barras FROM cmm_almacen WHERE Disponible = 1 {where};', (!['LSucursal', 'LInterna', 'Producto'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Clave FROM cmm_productos {where};', (filter.column == 'Producto' ? `Clave LIKE '%${filter.filter}%'` : ''), 'Producto']);
                db.objectize(queries, true, ['ID', 'Producto', 'Existencia', 'Sucursal', 'Localización Interna', 'SKU', 'Serie', 'Notas', 'Código de Barras'], 'storeItem', 'SKU', function(ret) {
                    ret.pre = '<input type="button" value="Añadir existencia" class="form-control action" data-action="form.addStore" />' +
                        '<input type="button" value="Nueva salida de almacén" class="form-control action" data-action="form.newStoreOut" />' +
                        '<input type="button" value="Filtro por clave de producto" class="form-control action" data-action="bFilter.store.Producto" />';
                    callBack(ret);
                });
                break;
            case "exits":
                queries.push(['SELECT ID, Folio FROM cmm_ventas {where};', (filter.column == 'Venta' ? `Folio LIKE '%${filter.filter}%'` : ''), 'Venta']);
                queries.push(['SELECT ID, Venta, Estado, Productos, Notas, Fecha FROM cmm_almacenSalidas {where};', (!['Venta'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, false, ['ID', 'Folio de Venta', 'Estado', 'Productos', 'Notas', 'Fecha de salida'], 'outItem', 'Venta', function(ret) {
                    callBack(ret);
                });
                break;
            case "products":
                queries.push(['SELECT * FROM cmm_categoria {where};', (filter.column == 'Categoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Categoria']);
                queries.push(['SELECT ID, Nombre FROM cmm_subcategoria {where};', (filter.column == 'Subcategoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Subcategoria']);
                queries.push(['SELECT ID, Clave, Descripcion, VentaCC, Marca, Categoria, Subcategoria FROM cmm_productos {where};', (!['Categoria', 'Subcategoria', 'Marca'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM cmm_marca {where};', (filter.column == 'Marca' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Marca']);
                db.objectize(queries, true, ['ID', 'Clave Interna', 'Descripcion', 'Precio en Call Center', 'Marca'], 'productItem', 'Clave Interna', function(ret) {
                    callBack(ret);
                });
                break;
            default:
                this.current = 'home';
                break;
        }
    },
    Home: function(resultCallBack, filter = null, userID = 1) {
        this.Page(this.home, resultCallBack, filter, userID);
    }
}
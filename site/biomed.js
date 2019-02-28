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
            case 'notif':
                callBack({command: 'myNotif'})
                break;
            case 'dir':
                callBack({command: 'directory'})
                break;
            case 'biosat':
                queries.push(['SELECT * FROM cmm_clientes {where};', (filter.column == 'Cliente' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Cliente']);
                queries.push(['SELECT ID, Fecha FROM cmm_ventas {where};', (filter.column == 'Venta' ? `Fecha LIKE '%${filter.filter}%'` : ''), 'Venta']);
                queries.push(['SELECT *  FROM cmm_bioSatisfaccion {where};', (!['Cliente', 'Venta'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, true, ['ID', 'Cliente', 'Fecha', 'Ruta', 'Venta'], 'bioSatItem', 'Cliente', function(ret) {
                    callBack(ret);
                });
                break;
            case 'biochison':
                queries.push(['SELECT ID, Encargado FROM cmm_biomedica {where};', (filter.column == 'Revision' ? `Encargado LIKE '%${filter.filter}%'` : ''), 'Revision']);
                queries.push(['SELECT * FROM bio_chison {where};', (!['Revision'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM usuarios {where};', (filter.column == 'Revision' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Encargado de Revisión']);
                db.objectize(queries, false, ['ID', 'Número de Serie Chison', 'Inicio de Número de Serie', 'Días de Vigencia', 'Notas', 'Encargado de Revisión', 'Número de Serie del Producto'], 'bioChisonItem', 'Encargado de Revisión', function(ret) {
                    ret.pre = '<button class="action" data-action="form.newBioChison">Nuevo número de serie</button>';
                    callBack(ret);
                });
                break;
            case 'biorev':
                queries.push(['SELECT * FROM usuarios {where};', (filter.column == 'Encargado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Encargado']);
                queries.push(['SELECT *  FROM cmm_biomedica {where};', (!['Encargado', 'Producto'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Folio FROM cmm_ventas {where};', (filter.column =='Venta' ? `Folio LIKE '%${filter.filter}%'` : ''), 'Venta']);
                queries.push(['SELECT ID, Ruta FROM cmm_bioSatisfaccion {where};', (filter.column =='Carta' ? `Ruta LIKE '%${filter.filter}%'` : ''), 'Carta']);
                db.objectize(queries, false, ['ID', 'Fecha de Entrada', 'Producto', 'Tipo', 'Venta', 'Estado', 'Fecha de Salida', 'Encargado de Revisión', 'Carta de Satisfacción', 'Notas'], 'bioRevItem', 'Fecha de Entrada', function(ret) {
                    ret.pre = '<button class="action" data-action="form.voidBioRev">Nueva revisión sin venta</button>';
                    callBack(ret);
                });
                break;
            case 'sales':
                queries.push(['SELECT ID, Nombre FROM usuarios {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT * FROM cmm_ventas {where};', (!['Ejecutivo', 'Arrendadora', 'Paqueteria', 'Estado'].includes(filter.column) && filter.column != ''  ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM cmm_paqueterias {where};', (filter.column == 'Paqueteria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Paqueteria']);
                queries.push(['SELECT ID, Nombre FROM cmm_ventaEstados {where};', (filter.column == 'Estado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Estado']);
                queries.push(['SELECT ID, Nombre FROM cmm_arrendadoras {where};', (filter.column == 'Arrendadora' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Arrendadora']);
                db.objectize(queries, false, ['ID', 'Cliente', 'Factura', 'Productos', 'Saldo', 'Arrendadora', 'Notas', 'Fecha de Venta', 'Depósito', 'Fecha de Envío', 'Paquetería', 'Guía', 'Biomédica', 'Estado', 'Documentos', 'Folio', 'Ejecutivo', 'Notas Internas', 'Total' ], 'bioSaleItem', 'Ejecutivo', function(ret) {
                    ret.pre = '<button class="action" data-action="form.voidBioRev">Nueva revisión sin venta</button>';
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
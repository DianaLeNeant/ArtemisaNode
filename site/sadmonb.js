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
            case 'clients':
                queries.push(['SELECT * FROM cmm_ccategorias {where};', (filter.column == 'Categoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Categoria']);
                queries.push(['SELECT ID, Nombre FROM usuarios WHERE Acceso LIKE "%salesb%" OR Area = "19" {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT *  FROM cmm_clientes {where};', (!['Categoria', 'Ejecutivo'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM cmm_cespecialidades {where};', (filter.column == 'Subcategoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Subcategoria']);
                db.objectize(queries, true, ['ID', 'Razón Social', 'RFC', 'Domicilio', 'Ciudad', 'Municipio', 'Estado', 'Código Postal', 'Correo Electrónico', 'Teléfono', 'Nombre', 'Domicilio (Personal)', 'Ciudad (Personal)', 'Municipio (Personal)', 'Estado (Personal)', 'Código Postal (Personal)', 'Correo Electrónico (Personal)', 'Teléfono (Personal)', 'Categoría', 'Especialidad', 'Notas', 'Ejecutivo', 'Seguimiento'], 'clientItem', 'Nombre', function(ret) {
                    ret.pre = '<input type="button" value="Crear nuevo cliente" class="form-control action" data-action="form.newClientA" />';
                    callBack(ret);
                });
                break;
            case 'autoclients':
                queries.push(['SELECT * FROM cmm_ccategorias {where};', (filter.column == 'Categoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Categoria']);
                queries.push(['SELECT ID, Nombre FROM usuarios WHERE Acceso LIKE "%salesb%" OR Area = "19" {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT * FROM cmm_clientes WHERE Tags LIKE "%auto%" {where};', (!['Categoria', 'Ejecutivo'].includes(filter.column)  && filter.column != '' ? `${filter.column} BETWEEN '${filter.filter}'` : '')]);
                queries.push(['SELECT ID, Nombre FROM cmm_cespecialidades {where};', (filter.column == 'Subcategoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Subcategoria']);
                db.objectize(queries, true, ['ID', 'Razón Social', 'RFC', 'Domicilio', 'Ciudad', 'Municipio', 'Estado', 'Código Postal', 'Correo Electrónico', 'Teléfono', 'Nombre', 'Domicilio (Personal)', 'Ciudad (Personal)', 'Municipio (Personal)', 'Estado (Personal)', 'Código Postal (Personal)', 'Correo Electrónico (Personal)', 'Teléfono (Personal)', 'Categoría', 'Especialidad', 'Notas', 'Ejecutivo', 'Seguimiento', 'Tags', 'Creación'], 'clientItem norecursive', 'Nombre', function(ret) {
                    ret.pre = '<button class="action" data-action="dateTimeFilter.autoclients.Creacion">Filtro de fechas</button>';
                    callBack(ret);
                });
                break;
            case 'sales':
                queries.push(['SELECT ID, Nombre FROM usuarios WHERE Acceso Like "%salesb%" OR Area = "19" {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT * FROM cmm_ventas {where};', (!['Ejecutivo', 'Arrendadora', 'Paqueteria', 'Estado'].includes(filter.column) && filter.column != ''  ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM cmm_paqueterias {where};', (filter.column == 'Paqueteria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Paqueteria']);
                queries.push(['SELECT ID, Nombre FROM cmm_ventaEstados {where};', (filter.column == 'Estado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Estado']);
                queries.push(['SELECT ID, Nombre FROM cmm_arrendadoras {where};', (filter.column == 'Arrendadora' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Arrendadora']);
                queries.push(['SELECT ID, Nombre FROM cmm_clientes {where};', (filter.column == 'Cliente' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Cliente']);
                db.objectize(queries, false, ['ID', 'Cliente', 'Factura', 'Productos', 'Saldo', 'Arrendadora', 'Notas', 'Fecha de Venta', 'Depósito', 'Fecha de Envío', 'Paquetería', 'Guía', 'Biomédica', 'Estado', 'Documentos', 'Folio', 'Ejecutivo', 'Notas Internas', 'Total' ], 'saleItem sadmon', 'Ejecutivo', function(ret) {
                    callBack(ret);
                });
                break;
            case "ask":
                queries.push(['SELECT ID, Nombre FROM usuarios WHERE Acceso Like "%salesb%" OR Area = "19" {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT * FROM cmm_cotizaciones {where};', (!['Cliente', 'Arrendadora', 'Paqueteria', 'Estado'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT * FROM cmm_clientes {where};', (filter.column == 'Cliente' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Cliente']);
                queries.push(['SELECT ID, Nombre FROM cmm_paqueterias {where};', (filter.column == 'Paqueteria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Paqueteria']);
                queries.push(['SELECT ID, Nombre FROM cmm_ventaEstados {where};', (filter.column == 'Estado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Estado']);
                queries.push(['SELECT ID, Nombre FROM cmm_arrendadoras {where};', (filter.column == 'Arrendadora' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Arrendadora']);
                db.objectize(queries, false, ['ID', 'Cliente', 'Productos', 'Arrendadora', 'Notas', 'Fecha de Cotización', 'Paquetería', 'Estado', 'Documentos', 'Folio', 'Ejecutivo' ], 'askItem admon', 'Fecha de Cotización', function(ret) {
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
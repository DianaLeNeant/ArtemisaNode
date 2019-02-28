var db = require('db');
module.exports = {
    home: 'products',
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
            case 'clients':
                queries.push(['SELECT * FROM cmm_ccategorias {where};', (filter.column == 'Categoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Categoria']);
                queries.push(['SELECT ID, Nombre FROM cmm_cespecialidades {where};', (filter.column == 'Subcategoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Subcategoria']);
                queries.push(['SELECT *  FROM cmm_clientes WHERE Ejecutivo = "' + userID + '" {where};', (!['Categoria', 'Subcategoria'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, true, ['ID', 'Razón Social', 'RFC', 'Domicilio', 'Ciudad', 'Municipio', 'Estado', 'Código Postal', 'Correo Electrónico', 'Teléfono', 'Nombre', 'Domicilio (Personal)', 'Ciudad (Personal)', 'Municipio (Personal)', 'Estado (Personal)', 'Código Postal (Personal)', 'Correo Electrónico (Personal)', 'Teléfono (Personal)', 'Categoría', 'Especialidad', 'Notas', 'Ejecutivo', 'Seguimiento'], 'clientItem', 'Nombre', function(ret) {
                    ret.pre = '<input type="button" value="Crear nuevo recordatorio" class="form-control action" data-action="form.newReminder" />';
                    callBack(ret);
                });
                break;
            case 'events':
                queries.push(['SELECT ID, Nombre FROM usuarios {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT * FROM cenas WHERE Ejecutivo = "' + userID + '" {where};', (!['Ejecutivo'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, false, ['ID', 'Nombre', 'Razón social', 'E-Mail', 'Teléfono', 'Sector', 'Proyecto', 'QR', 'Fecha de Registro', 'Empresa'], 'eventItem', 'nombre', function(ret) {
                    callBack(ret);
                });
                break;
            case 'sales':
                queries.push(['SELECT ID, Nombre FROM cmm_clientes {where};', (filter.column == 'Cliente' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Cliente']);
                queries.push(['SELECT ID, Cliente, Folio, Productos, Saldo, Arrendadora, Fecha, Paqueteria, Guia, Estado, Notas, Interno, Total, Documentos, Ejecutivo FROM cmm_ventas WHERE Ejecutivo = "' + userID + '" {where};', (!['Cliente', 'Arrendadora', 'Paqueteria', 'Estado'].includes(filter.column) && filter.column != ''  ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM cmm_paqueterias {where};', (filter.column == 'Paqueteria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Paqueteria']);
                queries.push(['SELECT ID, Nombre FROM cmm_ventaEstados {where};', (filter.column == 'Estado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Estado']);
                queries.push(['SELECT ID, Nombre FROM usuarios {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT ID, Nombre FROM cmm_arrendadoras {where};', (filter.column == 'Arrendadora' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Arrendadora']);
                db.objectize(queries, false, ['ID', 'Cliente', 'Folio', 'Productos', 'Saldo', 'Arrendadora', 'Fecha de Venta', 'Paquetería', 'Guía', 'Estado', 'Notas', 'Notas Internas', 'Total', 'Documentos'], 'saleItem', 'Cliente', function(ret) {
                    ret.pre = '<button class="action" data-action="dateFilter.sales.Fecha">Filtro de fechas</button>';
                    callBack(ret);
                });
                break;
            case "ask":
                queries.push(['SELECT ID, Nombre FROM cmm_clientes {where};', (filter.column == 'Cliente' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Cliente']);
                queries.push(['SELECT ID, Cliente, Productos, Arrendadora, Fecha, Paqueteria, Notas FROM cmm_cotizaciones WHERE Ejecutivo = "' + userID + '" {where};', (!['Cliente', 'Arrendadora', 'Paqueteria', 'Estado'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM cmm_paqueterias {where};', (filter.column == 'Paqueteria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Paqueteria']);
                queries.push(['SELECT ID, Nombre FROM cmm_arrendadoras {where};', (filter.column == 'Arrendadora' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Arrendadora']);
                db.objectize(queries, false, ['ID', 'Cliente', 'Productos', 'Arrendadora', 'Fecha de Cotización', 'Paquetería', 'Notas' ], 'askItem', 'Cliente', function(ret) {
                    ret.pre = '<button class="action" data-action="dateFilter.sales.Fecha">Filtro de fechas</button>';
                    callBack(ret);
                });
                break;
            case "products":
                queries.push(['SELECT * FROM cmm_categoria {where};', (filter.column == 'Categoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Categoria']);
                queries.push(['SELECT ID, Nombre FROM cmm_marca {where};', (filter.column == 'Marca' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Marca']);
                queries.push(['SELECT ID, Clave, Marca, Descripcion, VentaCC, IVA, Categoria, Subcategoria, Moneda FROM cmm_productos {where};', (!['Categoria', 'Marca'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, true, ['ID', 'Clave Interna', 'Marca', 'Descripción', 'Precio en Call Center', 'IVA'], 'productItem', 'Clave Interna', function(ret) {
                    ret.pre = '<input type="button" value="Nuevo formulario vacío" class="form-control action" data-action="newForm" />';
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
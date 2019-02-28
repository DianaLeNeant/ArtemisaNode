var db = require('db');
module.exports = {
    home: 'clients',
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
                queries.push(['SELECT ID, Nombre FROM cmm_cespecialidades {where};', (filter.column == 'Subcategoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Subcategoria']);
                queries.push(['SELECT *  FROM cmm_clientes {where};', (!['Categoria', 'Subcategoria'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT ID, Nombre FROM usuarios {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                db.objectize(queries, true, ['ID', 'Razón Social', 'RFC', 'Domicilio', 'Ciudad', 'Municipio', 'Estado', 'Código Postal', 'Correo Electrónico', 'Teléfono', 'Nombre', 'Domicilio (Personal)', 'Ciudad (Personal)', 'Municipio (Personal)', 'Estado (Personal)', 'Código Postal (Personal)', 'Correo Electrónico (Personal)', 'Teléfono (Personal)', 'Categoría', 'Especialidad', 'Notas', 'Ejecutivo', 'Seguimiento'], 'clientItem', 'Nombre', function(ret) {
                    ret.pre = '<input type="button" value="Crear nuevo cliente" class="form-control action" data-action="form.newClientA" />' +
                            '<input type="button" value="Importar de lista" class="form-control action" data-action="form.newClientsCSV" />';
                    callBack(ret);
                });
                break;
            case 'autoclients':
                queries.push(['SELECT * FROM cmm_ccategorias {where};', (filter.column == 'Categoria' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Categoria']);
                queries.push(['SELECT ID, Nombre FROM usuarios {where};', (filter.column == 'Ejecutivo' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Ejecutivo']);
                queries.push(['SELECT * FROM cmm_clientes WHERE Tags LIKE "%auto%" {where};', (!['Categoria', 'Ejecutivo'].includes(filter.column)  && filter.column != '' ? `${filter.column} BETWEEN '${filter.filter}'` : '')]);
                db.objectize(queries, true, ['ID', 'Razón Social', 'RFC', 'Domicilio', 'Ciudad', 'Municipio', 'Estado', 'Código Postal', 'Correo Electrónico', 'Teléfono', 'Nombre', 'Domicilio (Personal)', 'Ciudad (Personal)', 'Municipio (Personal)', 'Estado (Personal)', 'Código Postal (Personal)', 'Correo Electrónico (Personal)', 'Teléfono (Personal)', 'Categoría', 'Especialidad', 'Notas', 'Ejecutivo', 'Seguimiento', 'Tags', 'Creación'], 'clientItem norecursive', 'Nombre', function(ret) {
                    ret.pre = '<button class="action" data-action="dateTimeFilter.autoclients.Creacion">Filtro de fechas</button>';
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
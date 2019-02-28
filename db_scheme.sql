# ************************************************************
# Sequel Pro SQL dump
# Version 4541
#
# http://www.sequelpro.com/
# https://github.com/sequelpro/sequelpro
#
# Host: * (MySQL *)
# Database: *
# Generation Time: *
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Dump of table archat
# ------------------------------------------------------------

DROP TABLE IF EXISTS `archat`;

CREATE TABLE `archat` (
  `Chat` text NOT NULL,
  `Welcome` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table areas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `areas`;

CREATE TABLE `areas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(254) NOT NULL,
  `Sufijo` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4;



# Dump of table armail
# ------------------------------------------------------------

DROP TABLE IF EXISTS `armail`;

CREATE TABLE `armail` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ArFrom` int(11) NOT NULL,
  `ArTo` int(11) NOT NULL,
  `Message` int(11) NOT NULL,
  `Attachments` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `arMail_fk0` (`ArFrom`),
  KEY `arMail_fk1` (`ArTo`),
  CONSTRAINT `arMail_fk0` FOREIGN KEY (`ArFrom`) REFERENCES `usuarios` (`ID`),
  CONSTRAINT `arMail_fk1` FOREIGN KEY (`ArTo`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table bio_chison
# ------------------------------------------------------------

DROP TABLE IF EXISTS `bio_chison`;

CREATE TABLE `bio_chison` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Serie` varchar(256) NOT NULL,
  `Fecha` date NOT NULL,
  `Dias` int(11) NOT NULL,
  `Notas` text NOT NULL,
  `Revision` int(11) NOT NULL,
  `ProductoSerie` text NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `bio_fk0` (`Revision`),
  CONSTRAINT `bio_fk0` FOREIGN KEY (`Revision`) REFERENCES `cmm_biomedica` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;



# Dump of table cenas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cenas`;

CREATE TABLE `cenas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `razon` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `sector` varchar(255) NOT NULL,
  `proyecto` tinyint(1) NOT NULL,
  `qr` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `ejecutivo` int(11) NOT NULL,
  `asistencia` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `reg_fk0` (`ejecutivo`),
  CONSTRAINT `reg_fk0` FOREIGN KEY (`ejecutivo`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;



# Dump of table cmm_almacen
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_almacen`;

CREATE TABLE `cmm_almacen` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Producto` int(11) NOT NULL,
  `Cantidad` int(11) NOT NULL,
  `LInterna` int(11) NOT NULL,
  `LSucursal` int(11) NOT NULL,
  `SKU` varchar(20) NOT NULL DEFAULT '',
  `Serie` varchar(100) NOT NULL DEFAULT '',
  `Notas` text,
  `Barras` text,
  `Disponible` tinyint(1) DEFAULT '1',
  `Entrada` date DEFAULT NULL,
  `Salida` date DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Almacen_fk0` (`LSucursal`),
  KEY `Almacen_fk1` (`Producto`),
  KEY `Almacen_fk2` (`LInterna`),
  CONSTRAINT `Almacen_fk0` FOREIGN KEY (`LSucursal`) REFERENCES `sucursales` (`ID`),
  CONSTRAINT `Almacen_fk1` FOREIGN KEY (`Producto`) REFERENCES `cmm_productos` (`ID`),
  CONSTRAINT `Almacen_fk2` FOREIGN KEY (`LInterna`) REFERENCES `cmm_lInternas` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_almacenSalidas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_almacenSalidas`;

CREATE TABLE `cmm_almacenSalidas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Venta` int(11) NOT NULL,
  `Estado` varchar(100) NOT NULL DEFAULT '',
  `Productos` text NOT NULL,
  `Notas` text,
  `Fecha` date NOT NULL,
  `Folio` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_arrendadoras
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_arrendadoras`;

CREATE TABLE `cmm_arrendadoras` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  `Telefono` varchar(255) NOT NULL,
  `Correo` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_bancos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_bancos`;

CREATE TABLE `cmm_bancos` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  `Banco` varchar(255) NOT NULL,
  `Sucursal` varchar(255) NOT NULL,
  `Cuenta` varchar(255) NOT NULL,
  `CLABE` varchar(255) NOT NULL,
  `Logo` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_biomedica
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_biomedica`;

CREATE TABLE `cmm_biomedica` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Entrada` date NOT NULL,
  `ProductoSerie` varchar(256) NOT NULL,
  `Tipo` int(11) DEFAULT NULL,
  `Venta` int(11) DEFAULT NULL,
  `Estado` varchar(20) DEFAULT NULL,
  `Salida` date DEFAULT NULL,
  `Encargado` int(11) DEFAULT NULL,
  `Carta` int(11) DEFAULT NULL,
  `Notas` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Biomedica_fk0` (`Encargado`),
  KEY `Biomedica_fk2` (`Venta`),
  KEY `Biomedica_fk3` (`Carta`),
  KEY `Biomedica_fk1` (`ProductoSerie`(191)),
  CONSTRAINT `Biomedica_fk0` FOREIGN KEY (`Encargado`) REFERENCES `usuarios` (`ID`),
  CONSTRAINT `Biomedica_fk2` FOREIGN KEY (`Venta`) REFERENCES `cmm_ventas` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=211 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_bioSatisfaccion
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_bioSatisfaccion`;

CREATE TABLE `cmm_bioSatisfaccion` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Cliente` int(11) NOT NULL,
  `Fecha` date NOT NULL,
  `Ruta` varchar(256) NOT NULL,
  `Venta` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `bioSat_fk0` (`Cliente`),
  KEY `bioSat_fk1` (`Venta`),
  CONSTRAINT `bioSat_fk0` FOREIGN KEY (`Cliente`) REFERENCES `cmm_clientes` (`ID`),
  CONSTRAINT `bioSat_fk1` FOREIGN KEY (`Venta`) REFERENCES `cmm_ventas` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_categoria
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_categoria`;

CREATE TABLE `cmm_categoria` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_ccategorias
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_ccategorias`;

CREATE TABLE `cmm_ccategorias` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_cespecialidades
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_cespecialidades`;

CREATE TABLE `cmm_cespecialidades` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_clientes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_clientes`;

CREATE TABLE `cmm_clientes` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `RazonSocial` varchar(255) DEFAULT '',
  `RFC` varchar(255) DEFAULT '',
  `Domicilio` varchar(255) DEFAULT '',
  `Ciudad` varchar(255) DEFAULT '',
  `Municipio` varchar(255) DEFAULT '',
  `Estado` varchar(255) DEFAULT '',
  `CP` varchar(255) DEFAULT '',
  `Correo` varchar(255) DEFAULT '',
  `Telefono` varchar(255) DEFAULT '',
  `Nombre` varchar(255) NOT NULL,
  `CDomicilio` varchar(255) DEFAULT '',
  `CCiudad` varchar(255) DEFAULT '',
  `CMunicipio` varchar(255) DEFAULT '',
  `CEstado` varchar(255) DEFAULT '',
  `CCP` varchar(255) DEFAULT '',
  `CCorreo` varchar(255) NOT NULL,
  `CTelefono` varchar(255) DEFAULT '',
  `Categoria` int(11) NOT NULL DEFAULT '1',
  `Subcategoria` int(11) NOT NULL DEFAULT '1',
  `Notas` text,
  `Ejecutivo` int(11) NOT NULL,
  `Seguimiento` text,
  `Tags` varchar(255) DEFAULT '{}',
  `Creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  KEY `Clientes_fk0` (`Categoria`),
  KEY `Clientes_fk1` (`Subcategoria`),
  KEY `Clientes_fk2` (`Ejecutivo`),
  CONSTRAINT `Clientes_fk0` FOREIGN KEY (`Categoria`) REFERENCES `cmm_ccategorias` (`ID`),
  CONSTRAINT `Clientes_fk1` FOREIGN KEY (`Subcategoria`) REFERENCES `cmm_cespecialidades` (`ID`),
  CONSTRAINT `Clientes_fk2` FOREIGN KEY (`Ejecutivo`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3926 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_cotizaciones
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_cotizaciones`;

CREATE TABLE `cmm_cotizaciones` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Cliente` int(11) NOT NULL,
  `Productos` text NOT NULL,
  `Arrendadora` int(11) DEFAULT '1',
  `Notas` text NOT NULL,
  `Fecha` date NOT NULL,
  `Paqueteria` int(11) DEFAULT NULL,
  `Estado` int(11) NOT NULL,
  `Documentos` text,
  `Folio` varchar(10) NOT NULL,
  `Ejecutivo` int(11) NOT NULL,
  `Interno` text,
  `Total` float DEFAULT NULL,
  `Logo` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `Ventas_fk0` (`Cliente`),
  KEY `Ventas_fk1` (`Estado`),
  KEY `Ventas_fk2` (`Arrendadora`),
  KEY `Ventas_fk3` (`Paqueteria`),
  KEY `Coti_fka` (`Ejecutivo`),
  CONSTRAINT `Coti_fka` FOREIGN KEY (`Ejecutivo`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3320 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_elementStatus
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_elementStatus`;

CREATE TABLE `cmm_elementStatus` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_fiscal
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_fiscal`;

CREATE TABLE `cmm_fiscal` (
  `Proveedor` int(11) NOT NULL,
  `Cedula` varchar(255) NOT NULL,
  `RFC` varchar(255) NOT NULL,
  `RazonSocial` varchar(255) NOT NULL,
  `Domicilio` varchar(255) NOT NULL,
  `Ciudad` varchar(255) NOT NULL,
  `Municipio` varchar(254) NOT NULL,
  `Estado` varchar(255) NOT NULL,
  `CP` int(11) NOT NULL,
  `Correo` varchar(255) NOT NULL,
  `Telefono` varchar(255) NOT NULL,
  `Moral` tinyint(1) NOT NULL,
  PRIMARY KEY (`Proveedor`),
  CONSTRAINT `Fiscal_fk0` FOREIGN KEY (`Proveedor`) REFERENCES `cmm_proveedor` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_lInternas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_lInternas`;

CREATE TABLE `cmm_lInternas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(256) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;



# Dump of table cmm_marca
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_marca`;

CREATE TABLE `cmm_marca` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=290 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_modelo
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_modelo`;

CREATE TABLE `cmm_modelo` (
  `Marca` int(11) NOT NULL,
  `Nombre` varchar(255) NOT NULL,
  KEY `Modelo_fk0` (`Marca`),
  CONSTRAINT `Modelo_fk0` FOREIGN KEY (`Marca`) REFERENCES `cmm_marca` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_moneda
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_moneda`;

CREATE TABLE `cmm_moneda` (
  `ID` int(11) NOT NULL,
  `Nombre` varchar(255) NOT NULL,
  `Cambio` float NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_paqueterias
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_paqueterias`;

CREATE TABLE `cmm_paqueterias` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(254) NOT NULL,
  `Contacto` varchar(254) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_productos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_productos`;

CREATE TABLE `cmm_productos` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Serie` varchar(255) DEFAULT NULL,
  `SAT` varchar(255) DEFAULT '',
  `Clave` varchar(255) NOT NULL,
  `Descripcion` text NOT NULL,
  `Moneda` int(11) NOT NULL DEFAULT '1',
  `Costo` float NOT NULL,
  `VentaTienda` float NOT NULL,
  `VentaCC` float NOT NULL,
  `Proveedor` int(11) NOT NULL,
  `Marca` int(11) NOT NULL,
  `Categoria` int(11) NOT NULL,
  `Subcategoria` int(11) NOT NULL,
  `Datos` text,
  `IVA` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`ID`),
  KEY `Precios_fk0` (`Proveedor`),
  KEY `Precios_fk2` (`Categoria`),
  KEY `Precios_fk3` (`Subcategoria`),
  KEY `Precios_fk4` (`Moneda`),
  KEY `Precios_fk1` (`Marca`),
  CONSTRAINT `Precios_fk0` FOREIGN KEY (`Proveedor`) REFERENCES `cmm_proveedor` (`ID`),
  CONSTRAINT `Precios_fk1` FOREIGN KEY (`Marca`) REFERENCES `cmm_marca` (`ID`),
  CONSTRAINT `Precios_fk2` FOREIGN KEY (`Categoria`) REFERENCES `cmm_categoria` (`ID`),
  CONSTRAINT `Precios_fk3` FOREIGN KEY (`Subcategoria`) REFERENCES `cmm_subcategoria` (`ID`),
  CONSTRAINT `Precios_fk4` FOREIGN KEY (`Moneda`) REFERENCES `cmm_moneda` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=12907 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_proveedor
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_proveedor`;

CREATE TABLE `cmm_proveedor` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  `RazonSocial` varchar(255) NOT NULL,
  `Contacto` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_subcategoria
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_subcategoria`;

CREATE TABLE `cmm_subcategoria` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=972 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_ventaEstados
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_ventaEstados`;

CREATE TABLE `cmm_ventaEstados` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(254) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_ventaPrioridades
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_ventaPrioridades`;

CREATE TABLE `cmm_ventaPrioridades` (
  `ID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(256) DEFAULT NULL,
  `Clase` varchar(20) DEFAULT 'alert-info',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4;



# Dump of table cmm_ventas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `cmm_ventas`;

CREATE TABLE `cmm_ventas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Cliente` int(11) NOT NULL,
  `Factura` varchar(255) DEFAULT NULL,
  `Productos` text,
  `Saldo` int(11) DEFAULT NULL,
  `Arrendadora` int(11) DEFAULT '1',
  `Notas` text NOT NULL,
  `Fecha` date NOT NULL,
  `Deposito` tinyint(1) DEFAULT NULL,
  `Envio` date DEFAULT NULL,
  `Paqueteria` int(11) NOT NULL,
  `Guia` varchar(255) DEFAULT NULL,
  `Biomedica` int(11) DEFAULT NULL,
  `Estado` int(11) NOT NULL,
  `Documentos` text NOT NULL,
  `Folio` varchar(10) NOT NULL,
  `Ejecutivo` int(11) NOT NULL,
  `Interno` text,
  `Total` float DEFAULT NULL,
  `Logo` int(11) DEFAULT NULL,
  `Status` text,
  `CFDI` varchar(255) DEFAULT NULL,
  `MPAY` varchar(255) DEFAULT NULL,
  `FPAY` varchar(255) DEFAULT NULL,
  `Prioridad` int(11) DEFAULT '1',
  PRIMARY KEY (`ID`),
  KEY `Ventas_fk0` (`Cliente`),
  KEY `Ventas_fk1` (`Estado`),
  KEY `Ventas_fk2` (`Arrendadora`),
  KEY `Ventas_fk3` (`Paqueteria`),
  KEY `Ventas_fk4` (`Biomedica`),
  KEY `Ventas_fk5` (`Ejecutivo`),
  CONSTRAINT `Ventas_fk0` FOREIGN KEY (`Cliente`) REFERENCES `cmm_clientes` (`ID`),
  CONSTRAINT `Ventas_fk1` FOREIGN KEY (`Estado`) REFERENCES `cmm_ventaEstados` (`ID`),
  CONSTRAINT `Ventas_fk2` FOREIGN KEY (`Arrendadora`) REFERENCES `cmm_arrendadoras` (`ID`),
  CONSTRAINT `Ventas_fk3` FOREIGN KEY (`Paqueteria`) REFERENCES `cmm_paqueterias` (`ID`),
  CONSTRAINT `Ventas_fk4` FOREIGN KEY (`Biomedica`) REFERENCES `cmm_biomedica` (`ID`) ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT `Ventas_fk5` FOREIGN KEY (`Ejecutivo`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=299 DEFAULT CHARSET=utf8mb4;



# Dump of table contratos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `contratos`;

CREATE TABLE `contratos` (
  `Empleado` int(11) NOT NULL,
  `Inicio` date NOT NULL,
  `Final` date NOT NULL,
  KEY `Contratos_fk0` (`Empleado`),
  CONSTRAINT `Contratos_fk0` FOREIGN KEY (`Empleado`) REFERENCES `empleados` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table documentacion
# ------------------------------------------------------------

DROP TABLE IF EXISTS `documentacion`;

CREATE TABLE `documentacion` (
  `Empleado` int(11) NOT NULL,
  `Contrato` varchar(255) NOT NULL,
  `Confidencialidad` varchar(255) NOT NULL,
  `CURP` varchar(255) NOT NULL,
  `RFC` varchar(255) NOT NULL,
  `NSS` varchar(255) NOT NULL,
  `ActaNacimiento` varchar(255) NOT NULL,
  `Nomina` varchar(255) NOT NULL,
  `Identificacion` varchar(255) NOT NULL,
  `Estudios` varchar(255) NOT NULL,
  `Domicilio` varchar(255) NOT NULL,
  `Curriculo` varchar(255) NOT NULL,
  `Celular` varchar(255) NOT NULL,
  `Tarjeta` varchar(255) NOT NULL,
  `Renuncia` varchar(255) NOT NULL,
  `Concentrado` varchar(255) NOT NULL,
  PRIMARY KEY (`Empleado`),
  KEY `Documentacion_fk0` (`Empleado`),
  CONSTRAINT `Documentacion_fk0` FOREIGN KEY (`Empleado`) REFERENCES `empleados` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table emergencias
# ------------------------------------------------------------

DROP TABLE IF EXISTS `emergencias`;

CREATE TABLE `emergencias` (
  `Empleado` int(11) NOT NULL,
  `Ref1` text NOT NULL,
  `Tel1` text NOT NULL,
  `Dir1` text NOT NULL,
  `Ref2` text NOT NULL,
  `Tel2` text NOT NULL,
  `Dir2` text NOT NULL,
  KEY `Emergencias_fk0` (`Empleado`),
  CONSTRAINT `Emergencias_fk0` FOREIGN KEY (`Empleado`) REFERENCES `empleados` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table empleados
# ------------------------------------------------------------

DROP TABLE IF EXISTS `empleados`;

CREATE TABLE `empleados` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  `CURP` varchar(255) NOT NULL,
  `RFC` varchar(255) NOT NULL,
  `NSS` varchar(255) NOT NULL,
  `Nacimiento` date NOT NULL,
  `Domicilio` varchar(255) NOT NULL,
  `Puesto` int(11) NOT NULL,
  `Sueldo` int(11) NOT NULL,
  `Tarjeta` varchar(16) NOT NULL,
  `Sucursal` int(11) NOT NULL,
  `Sangre` varchar(255) NOT NULL,
  `Alergias` varchar(255) DEFAULT '',
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `TelCorp` text,
  `MailCorp` text,
  `IdenCorp` text,
  `Documentos` varchar(256) DEFAULT '[]',
  `Referencia` varchar(255) DEFAULT NULL,
  `FechaIngreso` date DEFAULT NULL,
  `ContratoIndefinido` tinyint(1) NOT NULL DEFAULT '0',
  `AltaIMSS` date DEFAULT NULL,
  `Enfermedad` varchar(255) DEFAULT NULL,
  `Vacaciones` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Empleados_fk0` (`Puesto`),
  KEY `Empleados_fk1` (`Sucursal`),
  CONSTRAINT `Empleados_fk0` FOREIGN KEY (`Puesto`) REFERENCES `puestos` (`ID`),
  CONSTRAINT `Empleados_fk1` FOREIGN KEY (`Sucursal`) REFERENCES `sucursales` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=utf8;



# Dump of table empresas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `empresas`;

CREATE TABLE `empresas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(256) NOT NULL,
  `Header` text,
  `CSS` text NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4;



# Dump of table faltas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `faltas`;

CREATE TABLE `faltas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Empleado` int(11) NOT NULL,
  `Justificante` varchar(255) NOT NULL,
  `Fecha` date NOT NULL,
  `Observacion` text NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `Asistencias_fk0` (`Empleado`),
  CONSTRAINT `Asistencias_fk0` FOREIGN KEY (`Empleado`) REFERENCES `empleados` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=193 DEFAULT CHARSET=utf8;



# Dump of table icomm_board
# ------------------------------------------------------------

DROP TABLE IF EXISTS `icomm_board`;

CREATE TABLE `icomm_board` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Fecha` date NOT NULL,
  `Contenido` text NOT NULL,
  `Vigencia` date NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Dump of table imss
# ------------------------------------------------------------

DROP TABLE IF EXISTS `imss`;

CREATE TABLE `imss` (
  `Empleado` int(11) NOT NULL,
  `Activo` tinyint(1) NOT NULL,
  `Alta` datetime NOT NULL,
  KEY `IMSS_fk0` (`Empleado`),
  CONSTRAINT `IMSS_fk0` FOREIGN KEY (`Empleado`) REFERENCES `empleados` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table lada
# ------------------------------------------------------------

DROP TABLE IF EXISTS `lada`;

CREATE TABLE `lada` (
  `ID` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(256) DEFAULT NULL,
  `LADA` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4952 DEFAULT CHARSET=utf8mb4;



# Dump of table medallas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `medallas`;

CREATE TABLE `medallas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` int(11) NOT NULL,
  `Nivel` int(11) NOT NULL,
  `EXP` int(11) NOT NULL,
  `Detalles` text NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table niveles
# ------------------------------------------------------------

DROP TABLE IF EXISTS `niveles`;

CREATE TABLE `niveles` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` int(11) NOT NULL,
  `EXP` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table notas
# ------------------------------------------------------------

DROP TABLE IF EXISTS `notas`;

CREATE TABLE `notas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Titulo` varchar(255) NOT NULL,
  `Fecha` date NOT NULL,
  `Usuario` int(11) NOT NULL,
  `Contenido` text NOT NULL,
  `Urgencia` int(11) NOT NULL,
  `Vigencia` date NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `Notas_fk0` (`Usuario`),
  CONSTRAINT `Notas_fk0` FOREIGN KEY (`Usuario`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;



# Dump of table notificaciones
# ------------------------------------------------------------

DROP TABLE IF EXISTS `notificaciones`;

CREATE TABLE `notificaciones` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Destino` varchar(256) NOT NULL,
  `Creador` int(11) NOT NULL,
  `RAW` text NOT NULL,
  `Mensaje` text NOT NULL,
  `AtendidoPor` int(11) DEFAULT NULL,
  `Fecha` datetime NOT NULL,
  `Atencion` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Notif_fk0` (`Destino`(191)),
  KEY `Notif_fk1` (`Creador`),
  KEY `Notif_fk2` (`AtendidoPor`),
  KEY `Destino` (`Destino`(191)),
  KEY `Destino_2` (`Destino`(191)),
  CONSTRAINT `Notif_fk1` FOREIGN KEY (`Creador`) REFERENCES `usuarios` (`ID`),
  CONSTRAINT `Notif_fk2` FOREIGN KEY (`AtendidoPor`) REFERENCES `usuarios` (`ID`) ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=3105 DEFAULT CHARSET=utf8mb4;



# Dump of table privatechat
# ------------------------------------------------------------

DROP TABLE IF EXISTS `privatechat`;

CREATE TABLE `privatechat` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ChatFrom` int(11) NOT NULL,
  `ChatTo` int(11) NOT NULL,
  `Chat` text NOT NULL,
  `Time` datetime NOT NULL,
  `Read` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `pchat_fk0` (`ChatFrom`),
  KEY `pchat_fk1` (`ChatTo`),
  CONSTRAINT `pchat_fk0` FOREIGN KEY (`ChatFrom`) REFERENCES `usuarios` (`ID`),
  CONSTRAINT `pchat_fk1` FOREIGN KEY (`ChatTo`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=271 DEFAULT CHARSET=latin1;



# Dump of table productos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `productos`;

CREATE TABLE `productos` (
  `SAT` varchar(8) DEFAULT NULL,
  `Clave` varchar(23) DEFAULT NULL,
  `Descripcion` varchar(502) DEFAULT NULL,
  `Moneda` int(1) DEFAULT '1',
  `VentaTienda` varchar(13) DEFAULT NULL,
  `VentaCC` varchar(13) DEFAULT NULL,
  `Proveedor` int(2) DEFAULT NULL,
  `Marca` varchar(9) DEFAULT NULL,
  `Categoria` int(2) DEFAULT NULL,
  `Subcategoria` int(3) DEFAULT NULL,
  `K` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;



# Dump of table puestos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `puestos`;

CREATE TABLE `puestos` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8;



# Dump of table sucursales
# ------------------------------------------------------------

DROP TABLE IF EXISTS `sucursales`;

CREATE TABLE `sucursales` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  `Domicilio` varchar(255) NOT NULL,
  `Estado` varchar(255) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;



# Dump of table support
# ------------------------------------------------------------

DROP TABLE IF EXISTS `support`;

CREATE TABLE `support` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `De` int(11) NOT NULL,
  `Mensaje` text NOT NULL,
  `Evidencia` text NOT NULL,
  `AtendidoPor` int(11) DEFAULT NULL,
  `Fecha` datetime NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `sp_fk0` (`De`),
  KEY `sp_fk1` (`AtendidoPor`),
  CONSTRAINT `sp_fk0` FOREIGN KEY (`De`) REFERENCES `usuarios` (`ID`),
  CONSTRAINT `sp_fk1` FOREIGN KEY (`AtendidoPor`) REFERENCES `usuarios` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;



# Dump of table telefonos
# ------------------------------------------------------------

DROP TABLE IF EXISTS `telefonos`;

CREATE TABLE `telefonos` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Empleado` int(11) NOT NULL,
  `Numero` varchar(255) DEFAULT NULL,
  `Serie` varchar(255) DEFAULT NULL,
  `Estado` varchar(255) DEFAULT NULL,
  `Inicio` date DEFAULT NULL,
  `Periodo` int(11) DEFAULT NULL,
  `Equipo` varchar(255) DEFAULT NULL,
  `Plan` varchar(255) DEFAULT NULL,
  `Renta` int(11) DEFAULT NULL,
  `IMEI` varchar(255) DEFAULT NULL,
  `Correo` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Empleado` (`Empleado`),
  CONSTRAINT `telefonos_ibfk_1` FOREIGN KEY (`Empleado`) REFERENCES `empleados` (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



# Dump of table usuarios
# ------------------------------------------------------------

DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` text NOT NULL,
  `Usr` varchar(255) NOT NULL,
  `Pss` varchar(255) NOT NULL,
  `Acceso` varchar(255) NOT NULL,
  `Correo` text NOT NULL,
  `Perfil` varchar(254) DEFAULT '',
  `Area` int(11) NOT NULL,
  `Chat` tinyint(1) NOT NULL DEFAULT '0',
  `Telefono` varchar(255) DEFAULT '01800 890 5174',
  `Empresas` varchar(255) NOT NULL DEFAULT '["*"]',
  `EXP` int(11) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `Areas_fk0` (`Area`),
  CONSTRAINT `Areas_fk0` FOREIGN KEY (`Area`) REFERENCES `areas` (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=171 DEFAULT CHARSET=utf8;



# Dump of table vacaciones
# ------------------------------------------------------------

DROP TABLE IF EXISTS `vacaciones`;

CREATE TABLE `vacaciones` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Empleado` int(11) NOT NULL,
  `Fecha` date NOT NULL,
  `Dias` int(11) NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

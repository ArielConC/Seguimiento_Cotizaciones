import os
import unittest
from pathlib import Path

import database
import db_backend
import directorio


class TestDirectorio(unittest.TestCase):
    def setUp(self):
        directorio.init_db()

    def test_save_and_get_contact(self):
        payload = {
            "nombre_completo": "Juan Pérez",
            "puesto": "Gerente de Planta",
            "empresa_nombre": "Empresa Test SA",
            "correo": "juan@test.com",
            "telefono": "4771234567",
            "telefono_2": "4779876543",
            "ubicacion_texto": "León, Guanajuato",
            "sitio_web": "https://test.com",
            "direccion": "Av. Principal 123",
            "notas": "Contacto clave",
            "origen": "test",
        }
        res = directorio.save_contact(payload)
        self.assertTrue(res["ok"])
        contact = res["contact"]
        cid = contact["id_contacto"]
        self.assertEqual(contact["nombre_completo"], "Juan Pérez")
        self.assertEqual(contact["empresa_nombre"], "Empresa Test SA")

        # Test listing
        listed = directorio.list_contacts(search="Juan")
        self.assertTrue(any(c["id_contacto"] == cid for c in listed))

        # Test vCard generation
        vcf, filename = directorio.generate_vcard(cid)
        self.assertIn("BEGIN:VCARD", vcf)
        self.assertIn("FN:Juan Pérez", vcf)
        self.assertIn("EMAIL;TYPE=INTERNET,WORK:juan@test.com", vcf)
        self.assertIn("END:VCARD", vcf)
        self.assertTrue(filename.endswith(".vcf"))

        # Test delete
        del_res = directorio.delete_contact(cid)
        self.assertTrue(del_res["ok"])
        self.assertIsNone(directorio.get_contact(cid))

    def test_save_catalogs(self):
        emp_res = directorio.save_empresa("Industrias XYZ Test", "Automotriz")
        self.assertTrue(emp_res["ok"])
        ubi_res = directorio.save_ubicacion("Nacional", "México", "Sonora Test")
        self.assertTrue(ubi_res["ok"])

        cats = directorio.get_catalogs()
        self.assertTrue(any(e["nombre"] == "Industrias XYZ Test" for e in cats["empresas"]))
        self.assertTrue(any(u["estado"] == "Sonora Test" for u in cats["ubicaciones"]))

    def test_auto_register_catalogs_from_contact(self):
        payload = {
            "nombre_completo": "Ana Torres",
            "empresa_nombre": "Empresa Automatica SA",
            "ubicacion_texto": "Monterrey, Nuevo León, México",
            "correo": "ana@auto.com",
        }
        res = directorio.save_contact(payload)
        self.assertTrue(res["ok"])
        cats = directorio.get_catalogs()
        self.assertTrue(any(e["nombre"] == "Empresa Automatica SA" for e in cats["empresas"]))
        self.assertTrue(any("Nuevo León" in u["estado"] for u in cats["ubicaciones"]))

    def test_save_contact_with_double_sided_card(self):
        payload = {
            "nombre_completo": "Carlos Mendoza Doble",
            "empresa_nombre": "Empresa Doble Cara SA",
            "ubicacion_texto": "Querétaro, Qro.",
            "ubicacion_tipo": "Nacional",
            "foto_tarjeta": "data:image/jpeg;base64,frente123",
            "foto_tarjeta_reverso": "data:image/jpeg;base64,reverso456",
        }
        res = directorio.save_contact(payload)
        self.assertTrue(res["ok"])
        c = res["contact"]
        self.assertEqual(c["foto_tarjeta"], "data:image/jpeg;base64,frente123")
        self.assertEqual(c["foto_tarjeta_reverso"], "data:image/jpeg;base64,reverso456")
        self.assertEqual(c["ubicacion_tipo"], "Nacional")

    def test_company_normalization_and_unification(self):
        # 1. Registrar empresa base
        directorio.save_empresa("NT Tool de México", "Industrial")
        cats = directorio.get_catalogs()
        nt_emp = next(e for e in cats["empresas"] if "NT Tool" in e["nombre"])

        # 2. Guardar un contacto con la denominación legal larga en mayúsculas
        p1 = {
            "nombre_completo": "Pedro Ventas",
            "empresa_nombre": "NT TOOL DE MEXICO S.A DE C.V",
            "ubicacion_texto": "Querétaro, Qro.",
        }
        res1 = directorio.save_contact(p1)
        self.assertTrue(res1["ok"])
        c1 = res1["contact"]
        # Debe vincularse a la empresa canónica existente y adoptar el nombre limpio
        self.assertEqual(c1["id_empresa"], nt_emp["id_empresa"])
        self.assertEqual(c1["empresa_nombre"], "NT Tool de México")

        # 3. Probar unificación general
        unify_res = directorio.unify_catalogs()
        self.assertTrue(unify_res["ok"])

    def test_website_prefix_normalization(self):
        p = {
            "nombre_completo": "Sitio Test",
            "empresa_nombre": "Empresa Web",
            "sitio_web": "www.osgroyco.com.mx",
        }
        res = directorio.save_contact(p)
        self.assertTrue(res["ok"])
        c = res["contact"]
        self.assertEqual(c["sitio_web"], "https://www.osgroyco.com.mx")

    def test_prune_orphaned_catalogs_on_delete(self):
        # 1. Guardar contacto con empresa y ubicación únicas
        p = {
            "nombre_completo": "Contacto Temporal",
            "empresa_nombre": "Empresa Temporal Unica 123",
            "ubicacion_texto": "Colima, Colima",
        }
        res = directorio.save_contact(p)
        self.assertTrue(res["ok"])
        cid = res["contact"]["id_contacto"]

        cats_before = directorio.get_catalogs()
        self.assertTrue(any(e["nombre"] == "Empresa Temporal Unica 123" for e in cats_before["empresas"]))

        # 2. Eliminar el contacto
        del_res = directorio.delete_contact(cid)
        self.assertTrue(del_res["ok"])

        # 3. Verificar que la empresa y ubicación únicas fueron podadas automáticamente
        cats_after = directorio.get_catalogs()
        self.assertFalse(any(e["nombre"] == "Empresa Temporal Unica 123" for e in cats_after["empresas"]))


if __name__ == "__main__":
    unittest.main()


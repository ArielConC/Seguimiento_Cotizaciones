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


if __name__ == "__main__":
    unittest.main()


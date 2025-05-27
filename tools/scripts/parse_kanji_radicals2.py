import xml.etree.ElementTree as ET
import json
import zipfile

def parse_kanji_radicals(zip_filepath, xml_filename):
    with zipfile.ZipFile(zip_filepath, 'r') as z:
        with z.open(xml_filename) as xml_file:
            tree = ET.parse(xml_file)
            root = tree.getroot()

            kanji_radicals = {}
            for character in root.findall('character'):
                literal = character.find('literal').text
                radicals = [rad.text for rad in character.findall(".//rad_value[@rad_type='classical']")]
                kanji_radicals[literal] = radicals

            with open('../data/kanji_to_radicals.json', 'w', encoding='utf-8') as f:
                json.dump(kanji_radicals, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    parse_kanji_radicals('../data/kanjidic2.zip', 'kanjidic2.xml')

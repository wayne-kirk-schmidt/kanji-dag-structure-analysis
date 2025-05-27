import xml.etree.ElementTree as ET
import json
import zipfile

def parse_kanjidic2(zip_filepath, xml_filename):
    with zipfile.ZipFile(zip_filepath, 'r') as z:
        with z.open(xml_filename) as xml_file:
            tree = ET.parse(xml_file)
            root = tree.getroot()

            kanji_list = []
            for character in root.findall('character'):
                literal = character.find('literal').text
                meanings = [meaning.text for meaning in character.findall(".//meaning") if meaning.get('m_lang') is None]
                onyomi = [reading.text for reading in character.findall(".//reading[@r_type='ja_on']")]
                kunyomi = [reading.text for reading in character.findall(".//reading[@r_type='ja_kun']")]

                kanji_list.append({
                    "kanji": literal,
                    "meanings": meanings,
                    "onyomi": onyomi,
                    "kunyomi": kunyomi
                })

            # Write the parsed data to a JSON file
            with open('kanji_data.json', 'w', encoding='utf-8') as f:
                json.dump(kanji_list, f, ensure_ascii=False, indent=2)

# Execute parsing function
if __name__ == "__main__":
    parse_kanjidic2('../data/kanjidic2.zip', 'kanjidic2.xml')

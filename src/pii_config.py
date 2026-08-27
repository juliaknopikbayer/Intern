from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider

configuration = {
    "nlp_engine_name": "spacy",
    "models":[
        {"lang_code": "en", "model_name":"en_core_web_sm"}, 
        {"lang_code": "pl", "model_name":"pl_core_news_sm"}, 
        {"lang_code": "de", "model_name":"de_core_news_sm"}, 
        {"lang_code": "xx", "model_name":"xx_ent_wiki_sm"}, 
        ],
    }

provider = NlpEngineProvider(nlp_configuration=configuration)
nlp_engine = provider.create_engine()


analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["en", "pl", "de", "xx"])
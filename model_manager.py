from byaldi import RAGMultiModalModel
from typing import Dict
import time
import threading
import os

class ModelManager:
    def __init__(self):
        self.models: Dict[str, tuple[RAGMultiModalModel, float]] = {}
        self.cache_timeout = 3600  # 1 hour
        self._start_cleanup_thread()

    def _start_cleanup_thread(self):
        def cleanup_loop():
            while True:
                self.clear_cache()
                time.sleep(300)  # Sleep for 5 minutes

        # Start cleanup thread as daemon so it doesn't prevent app shutdown
        cleanup_thread = threading.Thread(target=cleanup_loop, daemon=True)
        cleanup_thread.start()

    def get_model(self, device: str = "mps") -> RAGMultiModalModel:
        current_time = time.time()
        
        # Check if model exists
        if "./TreeIndex" in self.models:
            model, _ = self.models["./TreeIndex"]
            # Update timestamp on access
            self.models["./TreeIndex"] = (model, current_time)
            return model
        
        # Load new model
        model = RAGMultiModalModel.from_index(
            index_path="./TreeIndex", 
            index_root="./index", 
            device=device
        )
        
        # Cache model with timestamp
        self.models["./TreeIndex"] = (model, current_time)
        return model

    def clear_cache(self):
        current_time = time.time()
        expired_keys = [
            key for key, (_, timestamp) in self.models.items() 
            if current_time - timestamp > self.cache_timeout
        ]
        for key in expired_keys:
            del self.models[key]
            print(f"Cleared model for class {key} from cache")  # Optional logging

    def load_class_into_cache(self, class_id: str, index_root: str, device: str = "mps") -> bool:
        try:
            if not os.path.exists(f"{index_root}/{class_id}"):
                return False
            
            if class_id not in self.models:
                model = RAGMultiModalModel.from_index(
                    index_path=class_id, 
                    index_root=index_root, 
                    device=device
                )
                self.models[class_id] = (model, time.time())
            return True
        except Exception as e:
            print(f"Error loading class {class_id}: {e}")
            return False

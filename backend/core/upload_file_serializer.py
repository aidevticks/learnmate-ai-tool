from rest_framework import serializers
from .models import UploadedFile

class UploadedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ['id', 'user', 'title', 'file','extracted_text','embedding', 'uploaded_at']
        read_only_fields = ['user', 'extracted_text', 'embedding','uploaded_at']
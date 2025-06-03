from rest_framework import serializers
from .models import UploadedFile

class UploadedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ['id', 'user', 'title', 'file', 'uploaded_at']
        read_only_fields = ['user', 'uploaded_at']
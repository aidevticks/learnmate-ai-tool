from django.db import models
from django.contrib.postgres.fields import ArrayField 
from django.contrib.auth.models import User

class UploadedFile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploads')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='uploads/')
    extracted_text = models.TextField(blank=True, null=True)
    embedding = ArrayField(models.FloatField(), blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"

class Flashcard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcards')
    question = models.TextField()
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    source_file = models.ForeignKey(UploadedFile, on_delete=models.SET_NULL, null=True, blank=True, related_name='flashcards')

    def __str__(self):
        return f"Flashcard for {self.user.username}: {self.question[:30]}"

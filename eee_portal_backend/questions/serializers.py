from rest_framework import serializers
from .models import Question, Section, Scope


class ScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scope
        fields = ['id', 'scope']


class SectionSlugRelatedField(serializers.SlugRelatedField):
    def to_internal_value(self, data):
        if not data:
            return None
        section, created = Section.objects.get_or_create(sectionName=data.strip())
        return section


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['id', 'sectionName']



class QuestionSerializer(serializers.ModelSerializer):
    question_section = SectionSlugRelatedField(
        slug_field='sectionName',
        queryset=Section.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model  = Question
        fields = [
            'id', 'question',
            'explanation', 'question_section', 'feedback_for_yes', 'feedback_for_no',
            'guidance', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuestionListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views — omits guidance/remarks to reduce payload."""
    question_section = SectionSlugRelatedField(
        slug_field='sectionName',
        queryset=Section.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model  = Question
        fields = ['id', 'question', 'question_section', 'is_active']


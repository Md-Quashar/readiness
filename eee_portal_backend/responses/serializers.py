from rest_framework import serializers
from .models import Response


class ResponseSerializer(serializers.ModelSerializer):
    # We make user read-only so it's not required in the POST body
    user = serializers.ReadOnlyField(source='user.email')
    # Accept a list for `scope`. Coerce empty-string to empty list for compatibility
    scope = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        allow_empty=True,
        required=False,
    )

    def to_internal_value(self, data):
      if 'scope' in data and isinstance(data['scope'], str):
        scope_val = data['scope'].strip()
        data = data.copy()
        # Split on comma, strip whitespace; empty string becomes []
        data['scope'] = [s.strip() for s in scope_val.split(',')] if scope_val else []
      return super().to_internal_value(data)
    class Meta:
        model = Response
        fields = [
            'id', 'user', 'question', 'answer',
            'lab_type', 'scope', 'created_at', 'updated_at'
        ]

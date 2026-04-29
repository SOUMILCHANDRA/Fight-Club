using UnityEngine;

namespace ProjectMayhem.Systems
{
    public class CameraFollow : MonoBehaviour
    {
        public Transform Target;
        public Vector3 Offset = new Vector3(0, 5, 8);
        public float SmoothSpeed = 0.125f;

        private float _shakeIntensity = 0f;
        private Vector3 _shakeOffset;

        private void LateUpdate()
        {
            if (Target == null) return;

            // Handle Shake
            if (_shakeIntensity > 0)
            {
                _shakeOffset = new Vector3(
                    Random.Range(-1f, 1f) * _shakeIntensity,
                    Random.Range(-1f, 1f) * _shakeIntensity,
                    0
                );
                _shakeIntensity = Mathf.Lerp(_shakeIntensity, 0, Time.deltaTime * 5f);
            }
            else
            {
                _shakeOffset = Vector3.zero;
            }

            Vector3 desiredPosition = Target.position + Offset + _shakeOffset;
            Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition, SmoothSpeed);
            transform.position = smoothedPosition;

            transform.LookAt(Target.position);
        }

        public void Shake(float intensity)
        {
            _shakeIntensity = intensity;
        }
    }
}

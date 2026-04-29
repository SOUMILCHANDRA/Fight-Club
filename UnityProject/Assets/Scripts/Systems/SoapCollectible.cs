using UnityEngine;

namespace ProjectMayhem.Systems
{
    public class SoapCollectible : MonoBehaviour
    {
        public float RotationSpeed = 50f;
        public float FloatAmplitude = 0.5f;
        public float FloatFrequency = 1f;

        private Vector3 _startPos;

        private void Start()
        {
            _startPos = transform.position;
        }

        private void Update()
        {
            // Rotate
            transform.Rotate(Vector3.up, RotationSpeed * Time.deltaTime);

            // Float
            Vector3 tempPos = _startPos;
            tempPos.y += Mathf.Sin(Time.time * FloatFrequency) * FloatAmplitude;
            transform.position = tempPos;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player"))
            {
                Debug.Log("SOAP COLLECTED: This is your life, and it's ending one minute at a time.");
                // Add score or sanity boost?
                Destroy(gameObject);
            }
        }
    }
}

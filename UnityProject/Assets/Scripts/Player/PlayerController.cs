using UnityEngine;
using ProjectMayhem;
using ProjectMayhem.Systems;

namespace ProjectMayhem.Player
{
    [RequireComponent(typeof(Rigidbody))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        public float NarratorSpeed = 5f;
        public float TylerSpeed = 8f;
        public float Friction = 0.9f;

        [Header("Combat Settings")]
        public float Stamina = 100f;
        public float MaxStamina = 100f;
        public float AttackStaminaCost = 20f;
        public float StaminaRegenRate = 5f;
        public float AttackDuration = 0.4f;
        public float AttackRange = 2f;
        public LayerMask EnemyLayer;
        public float BaseDamage = 20f;

        private Rigidbody _rb;
        private PersonalityManager _personality;
        private SanitySystem _sanity;
        
        private bool _isAttacking;
        private bool _isBlocking;
        private float _attackCooldown;
        private Vector3 _moveDirection;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody>();
            _personality = GetComponent<PersonalityManager>();
            _sanity = GetComponent<SanitySystem>();
            
            // Setup Rigidbody
            _rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;
        }

        private void Update()
        {
            HandleInput();
            HandleCombat();
            UpdateVisuals();
        }

        private void FixedUpdate()
        {
            ApplyMovement();
        }

        private void HandleInput()
        {
            float horizontal = Input.GetAxisRaw("Horizontal");
            float vertical = Input.GetAxisRaw("Vertical");
            _moveDirection = new Vector3(horizontal, 0, vertical).normalized;

            // Apply Jitter in Chaos mode
            if (_personality.Mode == PersonaMode.CHAOS && Random.value < 0.1f)
            {
                _moveDirection += new Vector3(Random.Range(-0.5f, 0.5f), 0, Random.Range(-0.5f, 0.5f));
            }

            // Input delay/responsiveness reduction at low sanity
            if (_sanity.Tier == SanityTier.DISTORTED || _sanity.Tier == SanityTier.HALLUCINATING)
            {
                _moveDirection *= 0.6f;
            }
        }

        private void ApplyMovement()
        {
            float currentSpeed = (_personality.Mode == PersonaMode.TYLER) ? TylerSpeed : NarratorSpeed;
            Vector3 targetVelocity = _moveDirection * currentSpeed;
            
            Vector3 velocityChange = targetVelocity - _rb.linearVelocity;
            velocityChange.y = 0; // Don't affect gravity
            
            _rb.AddForce(velocityChange, ForceMode.VelocityChange);
            
            // Artificial friction/snappiness
            if (_moveDirection.magnitude < 0.1f)
            {
                _rb.linearVelocity = new Vector3(_rb.linearVelocity.x * Friction, _rb.linearVelocity.y, _rb.linearVelocity.z * Friction);
            }
        }

        private void HandleCombat()
        {
            // Attack (Space key)
            if (Input.GetKeyDown(KeyCode.Space) && _attackCooldown <= 0 && Stamina >= AttackStaminaCost)
            {
                StartAttack();
            }

            // Block (K key)
            _isBlocking = Input.GetKey(KeyCode.K);

            // Cooldowns
            if (_attackCooldown > 0)
            {
                _attackCooldown -= Time.deltaTime;
                if (_attackCooldown <= (AttackDuration * 0.5f)) _isAttacking = false;
            }

            // Stamina recovery
            if (!_isAttacking && Stamina < MaxStamina)
            {
                Stamina += StaminaRegenRate * Time.deltaTime;
            }
            
            Stamina = Mathf.Clamp(Stamina, 0, MaxStamina);
        }

        private void StartAttack()
        {
            _isAttacking = true;
            _attackCooldown = AttackDuration;
            Stamina -= AttackStaminaCost;
            
            float damage = BaseDamage;
            if (_personality.Mode == PersonaMode.TYLER) damage *= 2.5f;
            if (_sanity.Tier == SanityTier.HALLUCINATING) damage *= 2f;
            
            CombatManager.Instance.ResolveHit(transform, AttackRange, damage, EnemyLayer);
            
            // Add screenshake on hit? (Can be done in CombatManager or here)
            FindObjectOfType<CameraFollow>()?.Shake(0.2f);
        }

        private void UpdateVisuals()
        {
            // Lean into movement
            float leanAngle = -_moveDirection.x * 10f;
            transform.rotation = Quaternion.Lerp(transform.rotation, Quaternion.Euler(0, 0, leanAngle), Time.deltaTime * 5f);
            
            // Color change handled elsewhere or via material property block
        }
    }
}

<?php
/**
 * SwissMAT Sàrl — Contact Form Handler
 * Receives POST data, validates, and sends email.
 */

header('Content-Type: application/json; charset=utf-8');

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Honeypot check
if (!empty($_POST['website'])) {
    // Bot detected — fake success
    echo json_encode(['success' => true]);
    exit;
}

// Rate limiting (simple file-based)
$rateFile = sys_get_temp_dir() . '/swissmat_rate_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (file_exists($rateFile) && (time() - filemtime($rateFile)) < 60) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Too many requests. Please wait.']);
    exit;
}

// Sanitize inputs
$name    = trim(strip_tags($_POST['name'] ?? ''));
$email   = trim(strip_tags($_POST['email'] ?? ''));
$company = trim(strip_tags($_POST['company'] ?? ''));
$phone   = trim(strip_tags($_POST['phone'] ?? ''));
$subject = trim(strip_tags($_POST['subject'] ?? 'general'));
$message = trim(strip_tags($_POST['message'] ?? ''));

// Validation
$errors = [];
if (empty($name) || strlen($name) < 2) {
    $errors[] = 'Name is required.';
}
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Valid email is required.';
}
if (empty($message) || strlen($message) < 10) {
    $errors[] = 'Message must be at least 10 characters.';
}

// Check for injection attempts in headers
if (preg_match('/[\r\n]/', $name . $email)) {
    $errors[] = 'Invalid characters detected.';
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// Subject mapping
$subjects = [
    'general'     => 'General Inquiry',
    'partnership'  => 'Partnership',
    'technical'    => 'Technical Support',
    'other'        => 'Other'
];
$subjectLabel = $subjects[$subject] ?? 'General Inquiry';

// Build email
$to = 'info.swissmat@gmail.com';
$emailSubject = "[SwissMAT Website] {$subjectLabel} — {$name}";

$body = "New contact form submission from swissmat.ch\n";
$body .= "================================================\n\n";
$body .= "Name:    {$name}\n";
$body .= "Email:   {$email}\n";
$body .= "Company: " . ($company ?: '—') . "\n";
$body .= "Phone:   " . ($phone ?: '—') . "\n";
$body .= "Subject: {$subjectLabel}\n\n";
$body .= "Message:\n";
$body .= "------------------------------------------------\n";
$body .= "{$message}\n";
$body .= "------------------------------------------------\n\n";
$body .= "Sent from: {$_SERVER['REMOTE_ADDR']} at " . date('Y-m-d H:i:s') . "\n";

$headers = "From: noreply@swissmat.ch\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: SwissMAT-Contact/1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send
$sent = mail($to, $emailSubject, $body, $headers);

if ($sent) {
    // Update rate limit
    touch($rateFile);
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send email. Please try again.']);
}

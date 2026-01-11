#!/bin/bash

# ActivePieces Benchmark Script with Resource Monitoring
# This script runs Apache Bench and monitors Docker resource usage

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_URL="${1:-}"
CONCURRENCY="${2:-25}"
REQUESTS="${3:-5000}"
OUTPUT_DIR="benchmark_results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_requirements() {
    print_info "Checking requirements..."

    if ! command -v ab &> /dev/null; then
        print_error "Apache Bench (ab) is not installed"
        echo "Install it with: brew install apache-bench (macOS) or apt-get install apache2-utils (Linux)"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    print_success "All requirements met"
}

# Function to validate webhook URL
validate_webhook() {
    if [ -z "$WEBHOOK_URL" ]; then
        print_error "Webhook URL is required"
        echo ""
        echo "Usage: $0 <webhook_url> [concurrency] [requests]"
        echo ""
        echo "Example:"
        echo "  $0 http://localhost:8080/api/v1/webhooks/YOUR_ID/sync 25 5000"
        echo ""
        exit 1
    fi

    # Test webhook is reachable
    print_info "Testing webhook connectivity..."
    if curl -s -o /dev/null -w "%{http_code}" -X POST "$WEBHOOK_URL" | grep -q "200"; then
        print_success "Webhook is responding"
    else
        print_warning "Webhook test returned non-200 status (this might be OK)"
    fi
}

# Function to check Docker containers
check_containers() {
    print_info "Checking Docker containers..."

    if ! docker ps | grep -q activepieces; then
        print_error "ActivePieces container is not running"
        echo "Start it with: docker compose up -d"
        exit 1
    fi

    print_success "ActivePieces container is running"
}

# Function to start resource monitoring
start_monitoring() {
    print_info "Starting resource monitoring..."

    # Create output directory
    mkdir -p "$OUTPUT_DIR"

    # Start monitoring in background
    {
        echo "timestamp,container,cpu_percent,mem_usage,mem_limit,mem_percent,net_input,net_output,block_input,block_output"
        while true; do
            timestamp=$(date +%s)
            docker stats --no-stream --format "{{.Container}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}}" activepieces postgres redis | while IFS= read -r line; do
                # Parse docker stats output
                container=$(echo "$line" | cut -d',' -f1)
                cpu=$(echo "$line" | cut -d',' -f2 | tr -d '%')
                mem_usage=$(echo "$line" | cut -d',' -f3 | cut -d'/' -f1 | xargs)
                mem_limit=$(echo "$line" | cut -d',' -f3 | cut -d'/' -f2 | xargs)
                mem_percent=$(echo "$line" | cut -d',' -f4 | tr -d '%')
                net_io=$(echo "$line" | cut -d',' -f5)
                net_input=$(echo "$net_io" | cut -d'/' -f1 | xargs)
                net_output=$(echo "$net_io" | cut -d'/' -f2 | xargs)
                block_io=$(echo "$line" | cut -d',' -f6)
                block_input=$(echo "$block_io" | cut -d'/' -f1 | xargs)
                block_output=$(echo "$block_io" | cut -d'/' -f2 | xargs)

                echo "$timestamp,$container,$cpu,$mem_usage,$mem_limit,$mem_percent,$net_input,$net_output,$block_input,$block_output"
            done
            sleep 1
        done
    } > "$OUTPUT_DIR/resources_${TIMESTAMP}.csv" &

    MONITOR_PID=$!
    print_success "Resource monitoring started (PID: $MONITOR_PID)"
}

# Function to stop resource monitoring
stop_monitoring() {
    print_info "Stopping resource monitoring..."
    kill $MONITOR_PID 2>/dev/null || true
    wait $MONITOR_PID 2>/dev/null || true
    print_success "Resource monitoring stopped"
}

# Function to run benchmark
run_benchmark() {
    print_info "Running Apache Bench..."
    print_info "  Concurrency: $CONCURRENCY"
    print_info "  Requests: $REQUESTS"
    print_info "  URL: $WEBHOOK_URL"
    echo ""

    ab -c "$CONCURRENCY" -n "$REQUESTS" "$WEBHOOK_URL" > "$OUTPUT_DIR/ab_results_${TIMESTAMP}.txt" 2>&1

    print_success "Benchmark complete"
}

# Function to analyze resource usage
analyze_resources() {
    print_info "Analyzing resource usage..."

    # Skip header and calculate stats using awk
    awk -F',' '
    NR > 1 {
        cont = $2
        cpu[cont] += $3
        mem[cont] += $6
        count[cont]++

        if ($3 > max_cpu[cont]) max_cpu[cont] = $3
        if (min_cpu[cont] == 0 || $3 < min_cpu[cont]) min_cpu[cont] = $3

        if ($6 > max_mem[cont]) max_mem[cont] = $6
        if (min_mem[cont] == 0 || $6 < min_mem[cont]) min_mem[cont] = $6
    }
    END {
        for (c in count) {
            if (count[c] > 0) {
                printf "\n%s:\n", c
                printf "  CPU: avg=%.2f%%, min=%.2f%%, max=%.2f%%\n", cpu[c]/count[c], min_cpu[c], max_cpu[c]
                printf "  Memory: avg=%.2f%%, min=%.2f%%, max=%.2f%%\n", mem[c]/count[c], min_mem[c], max_mem[c]
            }
        }
    }
    ' "$OUTPUT_DIR/resources_${TIMESTAMP}.csv" > "$OUTPUT_DIR/resource_summary_${TIMESTAMP}.txt"

    print_success "Resource analysis complete"
}

# Function to generate report
generate_report() {
    print_info "Generating comprehensive report..."

    REPORT_FILE="$OUTPUT_DIR/benchmark_report_${TIMESTAMP}.md"

    cat > "$REPORT_FILE" << 'EOF'
# ActivePieces Benchmark Report

## Test Information

EOF

    cat >> "$REPORT_FILE" << EOF
- **Date:** $(date)
- **Webhook URL:** $WEBHOOK_URL
- **Concurrency Level:** $CONCURRENCY
- **Total Requests:** $REQUESTS

---

## Apache Bench Results

\`\`\`
EOF

    cat "$OUTPUT_DIR/ab_results_${TIMESTAMP}.txt" >> "$REPORT_FILE"

    cat >> "$REPORT_FILE" << EOF
\`\`\`

---

## Resource Usage Summary

\`\`\`
EOF

    cat "$OUTPUT_DIR/resource_summary_${TIMESTAMP}.txt" >> "$REPORT_FILE"

    cat >> "$REPORT_FILE" << EOF
\`\`\`

---

## Performance Metrics

EOF

    # Extract key metrics from ab results
    grep -E "(Requests per second|Time per request|Failed requests)" "$OUTPUT_DIR/ab_results_${TIMESTAMP}.txt" >> "$REPORT_FILE" || true

    cat >> "$REPORT_FILE" << EOF

---

## Files Generated

- Raw Apache Bench output: \`ab_results_${TIMESTAMP}.txt\`
- Resource usage CSV: \`resources_${TIMESTAMP}.csv\`
- Resource summary: \`resource_summary_${TIMESTAMP}.txt\`
- This report: \`benchmark_report_${TIMESTAMP}.md\`

---

## Next Steps

1. Review the resource usage to identify bottlenecks
2. Compare with previous benchmark runs
3. Adjust \`AP_FLOW_WORKER_CONCURRENCY\` if needed
4. Consider scaling strategies based on CPU/Memory usage

EOF

    print_success "Report generated: $REPORT_FILE"
}

# Function to display summary
display_summary() {
    echo ""
    echo "========================================"
    echo "         BENCHMARK SUMMARY"
    echo "========================================"
    echo ""

    # Extract key metrics
    RPS=$(grep "Requests per second:" "$OUTPUT_DIR/ab_results_${TIMESTAMP}.txt" | awk '{print $4}')
    TIME_PER_REQ=$(grep "Time per request:" "$OUTPUT_DIR/ab_results_${TIMESTAMP}.txt" | head -1 | awk '{print $4}')
    FAILED=$(grep "Failed requests:" "$OUTPUT_DIR/ab_results_${TIMESTAMP}.txt" | awk '{print $3}')

    print_success "Requests per second: $RPS"
    print_success "Time per request: ${TIME_PER_REQ}ms"
    print_success "Failed requests: $FAILED"
    echo ""

    print_info "Resource Usage:"
    cat "$OUTPUT_DIR/resource_summary_${TIMESTAMP}.txt"
    echo ""

    echo "========================================"
    print_success "All results saved to: $OUTPUT_DIR/"
    print_info "Full report: $OUTPUT_DIR/benchmark_report_${TIMESTAMP}.md"
    echo "========================================"
}

# Cleanup function
cleanup() {
    print_warning "Cleaning up..."
    stop_monitoring
    exit 1
}

# Trap Ctrl+C and errors
trap cleanup INT TERM ERR

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "   ActivePieces Benchmark Tool"
    echo "========================================"
    echo ""

    check_requirements
    validate_webhook
    check_containers

    echo ""
    print_warning "Starting benchmark in 3 seconds... Press Ctrl+C to cancel"
    sleep 3
    echo ""

    start_monitoring
    sleep 2  # Let monitoring stabilize

    run_benchmark

    sleep 2  # Collect a bit more data after benchmark
    stop_monitoring

    analyze_resources
    generate_report
    display_summary

    echo ""
    print_success "Benchmark complete!"
}

# Run main function
main

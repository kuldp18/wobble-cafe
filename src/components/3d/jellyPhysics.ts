export type JellyBody = { x: number; y: number; z: number; vx: number; vy: number; vz: number; squish: number; dragging: boolean; popping: boolean; lastX: number; lastY: number; spin: number };

export function stepJellies(bodies: JellyBody[], rawDelta: number) {
    // Small substeps avoid fast drops tunnelling through another piece.
    const dt = Math.min(rawDelta, .04) / 3;
    for (let step = 0; step < 3; step++) {
      for (const p of bodies) {
        p.squish *= Math.exp(-dt * 9);
        if (p.dragging) continue;
        p.vy -= 9.8 * dt; p.y += p.vy * dt;
        p.x += p.vx * dt; p.z += p.vz * dt;
        p.vx *= Math.exp(-dt * 2.2); p.vz *= Math.exp(-dt * 2.2);
        if (p.popping) continue;
        if (p.y < -.13) { p.y = -.13; p.squish = Math.max(p.squish, Math.min(.32, Math.abs(p.vy) * .045)); p.vy = Math.abs(p.vy) > .7 ? -p.vy * .46 : 0; }
        if (Math.abs(p.vx) < .015) p.vx = 0;
        if (Math.abs(p.vz) < .015) p.vz = 0;
        const radius = Math.hypot(p.x, p.z);
        if (radius > 1.75) {
          const nx = p.x / radius, nz = p.z / radius;
          p.x = nx * 1.75; p.z = nz * 1.75;
          const outward = p.vx * nx + p.vz * nz;
          if (outward > 0) { p.vx -= 1.5 * outward * nx; p.vz -= 1.5 * outward * nz; }
        }
      }
      // Resolve all three axes, including vertical contacts for stable stacks.
      for (let pass = 0; pass < 4; pass++) {
        for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], b = bodies[j];
          if (a.popping || b.popping) continue;
          const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
          const overlap = [.79 - Math.abs(dx), .64 - Math.abs(dy), .79 - Math.abs(dz)];
          if (overlap.some((v) => v <= 0)) continue;
          const axis = overlap[0] < overlap[1] && overlap[0] < overlap[2] ? 0 : overlap[1] < overlap[2] ? 1 : 2;
          const position = (["x", "y", "z"] as const)[axis], velocity = (["vx", "vy", "vz"] as const)[axis];
          const normal = Math.sign(b[position] - a[position]) || 1;
          const wa = a.dragging ? 0 : 1, wb = b.dragging ? 0 : 1, mass = wa + wb;
          if (!mass) continue;
          const correction = (overlap[axis] + .001) / mass;
          a[position] -= normal * correction * wa; b[position] += normal * correction * wb;
          const approach = (b[velocity] - a[velocity]) * normal;
          if (approach < -.08) {
            const impulse = -(1 + (Math.abs(approach) > 1 ? .35 : 0)) * approach / mass;
            a[velocity] -= impulse * normal * wa; b[velocity] += impulse * normal * wb;
            const compression = Math.min(.22, Math.abs(approach) * .035);
            a.squish = Math.max(a.squish, compression); b.squish = Math.max(b.squish, compression);
          }
          a.y = Math.max(-.13, a.y); b.y = Math.max(-.13, b.y);
        }
      }
    }
}
